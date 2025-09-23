import FetchedStore, { type FetchedStoreData } from '$lib/stores/FetchedStore';
import type { Listing, Shop } from '$lib/types/shops';
import { get } from 'svelte/store';

const itemName = 'shopsync';
const itemUrl = 'https://krawlet-api.twijn.dev/shopsync/shops';
const itemExpiry = 1000 * 60 * 10; // 10 minutes

const itemsRequiringNbt: string[] = ['minecraft:enchanted_book'];

class ShopSyncStore extends FetchedStore<Shop> {
	public sort(data: Shop[]): Shop[] {
		data.sort((a, b) => {
			return a.computerId - b.computerId;
		});
		return data;
	}
}

const store = new ShopSyncStore(itemName, itemUrl, itemExpiry);

// TODO: Move this into krawlet-api
export const cleanShopData = (str: string) => {
	return str.replace(/[^\w., '&]/g, '');
};

export const getShopById = (id: string): Shop | null => {
	const shops = get(store);
	return shops?.data?.find((x) => x.id === id) ?? null;
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
		return `/transactions/new?to_address=${encodeURIComponent(item?.addresses?.[0] ?? '')}&amount_ea=${item.prices?.[0]?.value ?? 1}&quantity_max=${item.stock}&metadata=${encodeURIComponent(item.prices?.[0].requiredMeta ?? '')}${lock ? '&lock=true' : ''}`;
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
		.join('/')}`;
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

export const getListing = (itemName: string, modId?: string): ItemListing | null => {
	if (modId) {
		itemName = modId + ':' + itemName;
	}
	const allListings = getListingsByItem(get(store));
	return allListings.find((x) => x.itemName === itemName) ?? null;
};

export default store;
