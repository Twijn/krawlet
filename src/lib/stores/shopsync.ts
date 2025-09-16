import FetchedStore from '$lib/stores/FetchedStore';
import type { Listing, ListingPrice, Shop } from '$lib/types/shops';
import { get } from 'svelte/store';

const itemName = 'shopsync';
const itemUrl = 'https://krawlet-api.twijn.dev/shopsync/shops';
const itemExpiry = 1000 * 60 * 10; // 10 minutes

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
    return str.replace(/[^\w., '&]/g, "");
}

export const getShopById = (id: string): Shop|null => {
    const shops = get(store);
    return shops?.data?.find(x => x.id === id) ?? null;
}

export const canBuyListing = (item: Listing): boolean => {
    const addresses = item?.addresses ?? [];
    const prices = item?.prices ?? [];
    return !item.requiresInteraction && // we can't handle interactions
        addresses.length > 0 && // needs an address
        prices.length > 0 && // needs a price
        prices[0].value > 0 && // price must be more than 0
        Boolean(item?.prices?.[0].requiredMeta) && // needs metadata
        ["kro", "kst"].includes(item?.prices?.[0]?.currency.toLowerCase() ?? ""); // must be kro or kst
}

export const getListingBuyLink = (item: Listing, lock: boolean = true): string => {
    let type: "kro" | "kst" = "kro";
    if ((item.prices?.[0]?.currency.toLowerCase() ?? "") === "kst") {
        type = "kst";
    }

    if (type === "kro") {
        return `/transactions/new?to_address=${encodeURIComponent(item?.addresses?.[0] ?? "")}&amount_ea=${item.prices?.[0]?.value ?? 1}&quantity_max=${item.stock}&metadata=${encodeURIComponent(item.prices?.[0].requiredMeta ?? "")}${lock ? '&lock=true' : ''}`;
    } else {
        return `https://krist.club/send?to=${encodeURIComponent(item?.addresses?.[0] ?? "")}&amount=${item.prices?.[0]?.value ?? 1}&metadata=${encodeURIComponent(item.prices?.[0].requiredMeta ?? "")}`;
    }
}

export type ShopWithListing = Shop & {listing: Listing};

export type ItemListing = {
    itemName: string;
    itemNbt: string | null;
    shops: ShopWithListing[];
};

export const getListingsByItem = (): ItemListing[] => {
    let listings: ItemListing[] = [];
    const shops = get(store);
    shops.data.forEach(shop => {
        if (!shop.items) return;

        shop.items.forEach(item => {
            let entry = listings.find(x => x.itemName == item.itemName && x.itemNbt == item.itemNbt);
            
            const shopWithListing: ShopWithListing = {
                ...shop,
                listing: item
            };
            if (entry) {
                entry.shops.push(shopWithListing);
            } else {
                listings.push({
                    itemName: item.itemName,
                    itemNbt: item.itemNbt,
                    shops: [shopWithListing]
                });
            }
        });
    });
    return listings;
};

export default store;
