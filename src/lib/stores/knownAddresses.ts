import FetchedStore from '$lib/stores/FetchedStore';
import { get } from 'svelte/store';

const itemName = 'known-addresses';
const itemUrl = 'https://krawlet-api.twijn.dev/knownaddresses';
const itemExpiry = 1000 * 60 * 60 * 2; // 2 hours

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

class KnownAddressStore extends FetchedStore<KnownAddress> {
	public sort(data: KnownAddress[]): KnownAddress[] {
		data.sort((a, b) => {
			if (a.type !== b.type) {
				return a.type.localeCompare(b.type);
			}
			return a.name.localeCompare(b.name);
		});
		return data;
	}
}

const store = new KnownAddressStore(itemName, itemUrl, itemExpiry);

export const getAddress = (address: string): KnownAddress | null => {
	const data = get(store);
	if (!data?.data) return null;
	return data.data.find((a) => a.address === address) || null;
};

export default store;
