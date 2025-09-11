import { createFetchedStore } from '$lib/stores/FetchedStore';
import { get } from 'svelte/store';

const itemName = 'known-addresses';
const itemUrl = 'https://krawlet-api.twijn.dev/knownaddresses';
const itemExpiry = 1000 * 60 * 60 * 2;

export type KnownAddressType = 'official' | 'shop' | 'gamble' | 'service' | 'company';

export interface KnownAddress {
	id: string;
	type: KnownAddressType;
	address: string;
	imageSrc?: string | null;
	name: string;
	description: string;
	createdDate?: string | null;
	updatedDate?: string | null;
}

const store = createFetchedStore<KnownAddress>(itemName, itemUrl, itemExpiry);

export const getAddress = (address: string): KnownAddress | null => {
	const data = get(store);
	if (!data?.data) return null;
	return data.data.find((a) => a.address === address) || null;
};

export default store;
