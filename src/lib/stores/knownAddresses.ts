import FetchedStore from '$lib/stores/FetchedStore';
import { get } from 'svelte/store';
import krawletClient from '$lib/api/krawlet';
import type { KnownAddress as KnownAddressApi } from 'krawlet-js';

const itemName = 'known-addresses';
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

// Transform krawlet-js KnownAddress to our local type
const transformKnownAddress = (addr: KnownAddressApi): KnownAddress => ({
	id: addr.id,
	type: addr.type,
	address: addr.address,
	imageSrc: addr.imageSrc,
	name: addr.name,
	description: addr.description,
	createdDate: addr.createdDate,
	updatedDate: addr.updatedDate
});

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

const fetchKnownAddresses = async (): Promise<KnownAddress[]> => {
	const addresses = await krawletClient.addresses.getAll();
	return addresses.map(transformKnownAddress);
};

const store = new KnownAddressStore(itemName, fetchKnownAddresses, itemExpiry);

export const getAddress = (address: string): KnownAddress | null => {
	const data = get(store);
	if (!data?.data) return null;
	return data.data.find((a) => a.address === address) || null;
};

export default store;
