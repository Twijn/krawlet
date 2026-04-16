import type { Name, NameLookupQuery } from 'kromer';
import { KromerCache } from './KromerCache';
import kromer from '../api/kromer';
import { getDB } from '.';

export type NameCacheLookup = NameLookupQuery & {
	addresses: string[];
};

export type NameCacheResult = {
	names: Name[];
	total: number;
};

export class NameCache extends KromerCache<NameCacheLookup, NameCacheResult> {
	protected async fetch(params: NameCacheLookup): Promise<NameCacheResult | null> {
		const { addresses, ...query } = params;
		const response = await kromer.names.lookupNames(addresses, query);
		return {
			names: response.names,
			total: response.total
		};
	}

	private normalizeName(name: Name): Name {
		return {
			...name,
			registered: name.registered instanceof Date ? name.registered : new Date(name.registered),
			updated: name.updated instanceof Date ? name.updated : new Date(name.updated),
			transferred: name.transferred
				? name.transferred instanceof Date
					? name.transferred
					: new Date(name.transferred)
				: undefined
		};
	}

	private toComparableValue(value: unknown): string | number {
		if (value instanceof Date) {
			return value.getTime();
		}

		if (typeof value === 'number') {
			return value;
		}

		if (typeof value === 'string') {
			const parsedDate = Date.parse(value);
			if (!Number.isNaN(parsedDate)) {
				return parsedDate;
			}
			return value;
		}

		return String(value ?? '');
	}

	private filterAndSort(names: Name[], params: NameCacheLookup): NameCacheResult {
		const result = [...names];

		// Get total before pagination
		const total = result.length;

		// Sort by the specified field
		const orderBy = params.orderBy ?? 'id';
		const order = params.order ?? 'DESC';

		result.sort((a, b) => {
			const aVal = a[orderBy as keyof Name];
			const bVal = b[orderBy as keyof Name];

			if (aVal === null || aVal === undefined) return order === 'ASC' ? 1 : -1;
			if (bVal === null || bVal === undefined) return order === 'ASC' ? -1 : 1;

			const aComparable = this.toComparableValue(aVal);
			const bComparable = this.toComparableValue(bVal);

			let comparison = 0;
			if (typeof aComparable === 'string' && typeof bComparable === 'string') {
				comparison = aComparable.localeCompare(bComparable);
			} else {
				comparison = aComparable < bComparable ? -1 : aComparable > bComparable ? 1 : 0;
			}

			return order === 'ASC' ? comparison : -comparison;
		});

		// Apply offset and limit
		const offset = params.offset ?? 0;
		const limit = params.limit ?? result.length;

		return {
			names: result.slice(offset, offset + limit),
			total
		};
	}

	protected async getFromCache(params: NameCacheLookup): Promise<NameCacheResult | null> {
		const db = await getDB();
		const tx = db.transaction('names', 'readonly');
		const store = tx.objectStore('names');
		const resultMap = new Map<string, Name>();

		if (params.addresses.length > 0) {
			for (const address of params.addresses) {
				// Query both from and to indexes
				const ownerIndex = store.index('ownerIndex');
				const originalOwnerIndex = store.index('originalOwnerIndex');

				const [fromNames, toNames] = await Promise.all([
					ownerIndex.getAll(address),
					originalOwnerIndex.getAll(address)
				]);

				// Use map to deduplicate by name
				for (const item of [...fromNames, ...toNames]) {
					resultMap.set(item.name, item);
				}
			}
		} else {
			// If no addresses specified, get all names
			const allItems = await store.getAll();
			for (const item of allItems) {
				resultMap.set(item.name, item);
			}
		}

		await tx.done;
		const result = Array.from(resultMap.values()).map((item) => this.normalizeName(item));
		if (result.length === 0) return null;

		// Filter and sort the normalized cached names
		const filtered = this.filterAndSort(result, params);
		return {
			names: filtered.names,
			total: filtered.total
		};
	}

	protected async saveToCache(data: NameCacheResult): Promise<void> {
		const db = await getDB();
		const tx = db.transaction('names', 'readwrite');
		const store = tx.objectStore('names');
		for (const item of data.names) {
			await store.put(item);
		}
		await tx.done;
	}
}
