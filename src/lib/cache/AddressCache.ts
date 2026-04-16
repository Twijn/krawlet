import type { Address, AddressesResponse, PaginatedQuery, TransactionWithMeta } from 'kromer';
import { KromerCache } from './KromerCache';
import kromer from '../api/kromer';
import { getDB } from '.';

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

type CachedAddress = AddressWithNames & {
	cachedAt?: number;
};

export class AddressCache extends KromerCache<AddressCacheLookup, AddressCacheResult> {
	private readonly rehydrateWindowMs = 60_000;

	public static async refreshCachedAddresses(addresses: string[]): Promise<void> {
		const uniqueAddresses = Array.from(
			new Set(addresses.map((address) => address?.trim()).filter(Boolean) as string[])
		);

		if (uniqueAddresses.length === 0) return;

		const response = await kromer.addresses.lookupAddresses(uniqueAddresses, true);
		const db = await getDB();
		const tx = db.transaction('addresses', 'readwrite');
		const store = tx.objectStore('addresses');
		const cachedAt = Date.now();

		for (const item of Object.values(response.addresses)) {
			await store.put({
				...item,
				cachedAt
			});
		}

		await tx.done;
	}

	public static async refreshFromTransaction(tx: Pick<TransactionWithMeta, 'from' | 'to'>): Promise<void> {
		await AddressCache.refreshCachedAddresses([tx.from ?? '', tx.to ?? '']);
	}

	private toAddress(cacheItem: CachedAddress): AddressWithNames {
		const address = { ...cacheItem };
		delete address.cachedAt;
		return address;
	}

	private buildResult(addresses: AddressWithNames[]): AddressCacheResult {
		const addressList = addresses.reduce(
			(acc, address) => {
				acc[address.address] = address;
				return acc;
			},
			{} as Record<string, AddressWithNames>
		);

		return {
			addressList,
			addresses,
			total: addresses.length,
			loading: false,
			error: null
		};
	}

	protected async fetch(params: AddressCacheLookup): Promise<AddressCacheResult | null> {
		if ('addresses' in params && params.addresses.length > 0) {
			const db = await getDB();
			const tx = db.transaction('addresses', 'readonly');
			const store = tx.objectStore('addresses');

			const now = Date.now();
			const cachedItems = await Promise.all(
				params.addresses.map((address) => store.get(address) as Promise<CachedAddress | undefined>)
			);
			await tx.done;

			const staleOrMissingAddresses: string[] = [];
			const addressMap = new Map<string, AddressWithNames>();

			for (const [index, address] of params.addresses.entries()) {
				const cached = cachedItems[index];

				if (!cached) {
					staleOrMissingAddresses.push(address);
					continue;
				}

				addressMap.set(address, this.toAddress(cached));

				if (!cached.cachedAt || now - cached.cachedAt > this.rehydrateWindowMs) {
					staleOrMissingAddresses.push(address);
				}
			}

			if (staleOrMissingAddresses.length === 0) {
				return this.buildResult(Array.from(addressMap.values()));
			}

			const response = await kromer.addresses.lookupAddresses(staleOrMissingAddresses, true);
			for (const address of Object.values(response.addresses)) {
				addressMap.set(address.address, address);
			}

			return this.buildResult(Array.from(addressMap.values()));
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
		const resultMap = new Map<string, AddressWithNames>();

		if ('addresses' in params && params.addresses.length > 0) {
			for (const address of params.addresses) {
				const cached = (await store.get(address)) as CachedAddress | undefined;
				if (cached) {
					resultMap.set(cached.address, this.toAddress(cached));
				}
			}
		} else {
			// If no addresses specified, get all addresses
			const allItems = (await store.getAll()) as CachedAddress[];
			for (const item of allItems) {
				resultMap.set(item.address, this.toAddress(item));
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
				{} as Record<string, AddressWithNames>
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
		const cachedAt = Date.now();
		for (const item of Object.values(data.addressList)) {
			await store.put({
				...item,
				cachedAt
			});
		}
		await tx.done;
	}
}
