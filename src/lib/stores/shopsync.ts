import FetchedStore, { type FetchedStoreData } from '$lib/stores/FetchedStore';
import type { Listing, Shop } from '$lib/types/shops';
import { get } from 'svelte/store';
import krawletClient from '$lib/api/krawlet';
import { KrawletError, type Shop as ShopApi, type Item as ItemApi } from 'krawlet-js';

const itemName = 'shopsync';
const itemExpiry = 1000 * 60 * 30; // 30 minutes

const itemsRequiringNbt: string[] = ['minecraft:enchanted_book'];

// Transform krawlet-js Item to our Listing type
const transformItem = (item: ItemApi): Listing => ({
	id: item.id,
	shopId: item.shopId,
	itemName: item.itemName,
	itemNbt: item.itemNbt,
	itemDisplayName: item.itemDisplayName,
	itemDescription: item.itemDescription,
	shopBuysItem: item.shopBuysItem,
	noLimit: item.noLimit,
	dynamicPrice: item.dynamicPrice,
	madeOnDemand: item.madeOnDemand,
	requiresInteraction: item.requiresInteraction,
	stock: item.stock,
	prices: item.prices?.map((p) => ({
		id: p.id,
		value: p.value,
		currency: p.currency,
		address: p.address,
		requiredMeta: p.requiredMeta
	})),
	addresses: item.addresses,
	createdDate: item.createdDate,
	updatedDate: item.updatedDate
});

// Transform krawlet-js Shop to our Shop type
const transformShop = (shop: ShopApi): Shop => ({
	id: shop.id,
	name: shop.name,
	description: shop.description,
	owner: shop.owner,
	computerId: shop.computerId,
	softwareName: shop.softwareName,
	softwareVersion: shop.softwareVersion,
	locationCoordinates: shop.locationCoordinates,
	locationDescription: shop.locationDescription,
	locationDimension: shop.locationDimension,
	items: shop.items?.map(transformItem),
	addresses: shop.addresses,
	createdDate: shop.createdDate,
	updatedDate: shop.updatedDate
});

class ShopSyncStore extends FetchedStore<Shop> {
	public sort(data: Shop[]): Shop[] {
		data.sort((a, b) => {
			return a.computerId - b.computerId;
		});
		return data;
	}
}

const fetchShops = async (): Promise<Shop[]> => {
	const shops = await krawletClient.shops.getAll();
	return shops.map(transformShop);
};

const store = new ShopSyncStore(itemName, fetchShops, itemExpiry);

// TODO: Move this into krawlet-api
export const cleanShopData = (str: string) => {
	return str.replace(/[^\w., '&]/g, '');
};

const fetchShopById = async (id: string): Promise<Shop | null> => {
	try {
		const shop = await krawletClient.shops.get(id);
		return transformShop(shop);
	} catch (error) {
		if (error instanceof KrawletError && error.code === 'SHOP_NOT_FOUND') {
			return null;
		}
		throw error;
	}
};

export const getShopById = async (id: string): Promise<Shop | null> => {
	const shops = get(store);
	let shop = shops?.data?.find((x) => x.id === id) ?? null;

	if (!shop) {
		shop = await fetchShopById(id);
	}

	return shop ?? null;
};

export const canBuyListing = (item: Listing): boolean => {
	const addresses = item?.addresses ?? [];
	const prices = item?.prices ?? [];
	return (
		!item.requiresInteraction && // we can't handle interactions
		addresses.length > 0 && // needs an address
		prices.length > 0 && // needs a price
		prices[0].value > 0 && // price must be more than 0
		Boolean(item?.prices?.[0].requiredMeta) && // needs metadata
		['kro', 'kst'].includes(item?.prices?.[0]?.currency.toLowerCase() ?? '')
	); // must be kro or kst
};

export const getListingBuyLink = (item: Listing, lock: boolean = true): string => {
	let type: 'kro' | 'kst' = 'kro';
	if ((item.prices?.[0]?.currency.toLowerCase() ?? '') === 'kst') {
		type = 'kst';
	}

	if (type === 'kro') {
		return `/transactions/new?type=purchase&to=${encodeURIComponent(item?.addresses?.[0] ?? '')}&unit_price=${item.prices?.[0]?.value ?? 1}&max_quantity=${item.stock}&metadata=${encodeURIComponent(item.prices?.[0].requiredMeta ?? '')}${lock ? '&lock=true' : ''}`;
	} else {
		return `https://krist.club/send?to=${encodeURIComponent(item?.addresses?.[0] ?? '')}&amount=${item.prices?.[0]?.value ?? 1}&metadata=${encodeURIComponent(item.prices?.[0].requiredMeta ?? '')}`;
	}
};

export const getItemImageUrl = (item: Listing | ItemListing) => {
	return `https://shops.alexdevs.me/assets/items/${item.itemName.replace(':', '/')}.png`;
};

export const getRelativeItemUrl = (item: Listing | ItemListing) => {
	return `/shops/items/${item.itemName
		.split(':')
		.map((x) => encodeURI(x))
		.join('/')}${item.itemNbt ? `/${encodeURIComponent(item.itemNbt)}` : ''}`;
};

export type ShopWithListing = Shop & { listing: Listing };

export type ItemListing = {
	itemDisplayName: string;
	itemName: string;
	itemNbt: string | null;
	shops: ShopWithListing[];
};

export const getListingsByItem = (shops: FetchedStoreData<Shop>): ItemListing[] => {
	const listings: ItemListing[] = [];
	shops.data.forEach((shop) => {
		if (!shop.items) return;

		shop.items.forEach((item) => {
			if (itemsRequiringNbt.includes(item.itemName.toLowerCase()) && !item.itemNbt) return;

			const entry = listings.find((x) => x.itemName == item.itemName && x.itemNbt == item.itemNbt);

			const shopWithListing: ShopWithListing = {
				...shop,
				listing: item
			};
			if (entry) {
				entry.shops.push(shopWithListing);
			} else {
				listings.push({
					itemDisplayName: item.itemDisplayName || item.itemName,
					itemName: item.itemName,
					itemNbt: item.itemNbt,
					shops: [shopWithListing]
				});
			}
		});
	});

	listings.forEach((listing) => {
		listing.shops.sort((a, b) => {
			// 1. In stock first
			const aStock = a.listing.stock ?? 0;
			const bStock = b.listing.stock ?? 0;
			if (aStock > 0 !== bStock > 0) {
				return bStock - aStock;
			}
			// 2. Price ascending (first price only)
			const aPrice = a.listing.prices?.[0]?.value ?? Infinity;
			const bPrice = b.listing.prices?.[0]?.value ?? Infinity;
			if (aPrice !== bPrice) {
				return aPrice - bPrice;
			}
			// 3. Shop computerId ascending
			return a.computerId - b.computerId;
		});
	});

	listings.sort((a, b) => a.itemDisplayName.localeCompare(b.itemDisplayName));
	return listings;
};

export const getListings = async (
	itemName: string,
	modId?: string,
	itemNbt?: string
): Promise<ItemListing[]> => {
	console.log('getListings', { itemName, modId, itemNbt });

	// Prepend modid if given
	if (modId) {
		itemName = modId + ':' + itemName;
	}

	// Retrieve the shops data directly if we don't have it yet
	let shopsData = get(store);
	if (!shopsData || !shopsData.data || shopsData.data.length === 0) {
		shopsData = await store.updateItems();
	}

	const allListings = getListingsByItem(shopsData);
	const filteredListings = allListings.filter(
		(x) => x.itemName === itemName && (itemNbt ? x.itemNbt === itemNbt : true)
	);
	return filteredListings;
};

export default store;
