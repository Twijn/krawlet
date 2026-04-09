import type { Address, AddressesResponse, PaginatedQuery } from 'kromer';
import { KromerCache } from './KromerCache';
import kromer from '../api/kromer';
import { getDB, type KrawletDatabase } from '.';

export type AddressCacheLookup =
	| PaginatedQuery
	| {
			addresses: string[];
			richest?: boolean;
	  };

export type AddressWithNames = Address & {
	names?: number;
};

export type AddressCacheResult = {
	addressList: Record<string, AddressWithNames>;
	addresses: AddressWithNames[];
	loading: boolean;
	error: Error | null;
	total: number;
};

export class AddressCache extends KromerCache<AddressCacheLookup, AddressCacheResult> {
	public static upgrade(db: KrawletDatabase): void {
		if (!db.objectStoreNames.contains('estorage')) {
			const store = db.createObjectStore('estorage', { keyPath: 'address' });
			store.createIndex('addressIndex', 'address');
		}
	}

	protected async fetch(params: AddressCacheLookup): Promise<AddressCacheResult | null> {
		if ('addresses' in params && params.addresses.length > 0) {
			const response = await kromer.addresses.lookupAddresses(params.addresses, true);
			return {
				addressList: response.addresses,
				addresses: Object.values(response.addresses),
				total: response.found,
				loading: false,
				error: null
			};
		} else if ('offset' in params && 'limit' in params) {
			let response: AddressesResponse | null = null;

			if ('richest' in params && params.richest) {
				response = await kromer.addresses.getRich({
					offset: params.offset,
					limit: params.limit
				});
			} else {
				response = await kromer.addresses.getAll({
					offset: params.offset,
					limit: params.limit
				});
			}

			const result = response.addresses.reduce(
				(acc, address) => {
					acc[address.address] = address;
					return acc;
				},
				{} as Record<string, Address>
			);

			return {
				addressList: result,
				addresses: Object.values(result),
				total: response.total,
				loading: false,
				error: null
			};
		}
		return null;
	}

	protected async getFromCache(params: AddressCacheLookup): Promise<AddressCacheResult | null> {
		const db = await getDB();
		const tx = db.transaction('addresses', 'readonly');
		const store = tx.objectStore('addresses');
		const resultMap = new Map<string, Address>();

		if ('addresses' in params && params.addresses.length > 0) {
			for (const address of params.addresses) {
				const addressIndex = store.index('addressIndex');

				for (const item of await addressIndex.get(address)) {
					resultMap.set(item.address, item);
				}
			}
		} else {
			// If no addresses specified, get all addresses
			const allItems = await store.getAll();
			for (const item of allItems) {
				resultMap.set(item.address, item);
			}
		}

		await tx.done;
		let result = Array.from(resultMap.values());
		if (result.length === 0) return null;

		if ('richest' in params && params.richest) {
			result.sort((a, b) => b.balance - a.balance);
		} else {
			result.sort((a, b) => {
				const firstSeenA = a.firstseen ? new Date(a.firstseen).getTime() : 0;
				const firstSeenB = b.firstseen ? new Date(b.firstseen).getTime() : 0;
				return firstSeenA - firstSeenB;
			});
		}

		if ('offset' in params && 'limit' in params) {
			const offset = params.offset || 0;
			const limit = params.limit || result.length;
			result = result.slice(offset, offset + limit);
		}

		return {
			addressList: result.reduce(
				(acc, address) => {
					acc[address.address] = address;
					return acc;
				},
				{} as Record<string, Address>
			),
			addresses: result,
			total: resultMap.size,
			loading: false,
			error: null
		};
	}

	protected async saveToCache(data: AddressCacheResult): Promise<void> {
		const db = await getDB();
		const tx = db.transaction('addresses', 'readwrite');
		const store = tx.objectStore('addresses');
		for (const item of Object.values(data.addressList)) {
			await store.put(item);
		}
		await tx.done;
	}
}
