import type { TransactionWithMeta, TransactionLookupQuery, Transaction } from 'kromer';
import { KromerCache } from './KromerCache';
import kromer from '../api/kromer';
import { getDB } from '.';

export type TransactionCacheLookup = TransactionLookupQuery & {
	addresses: string[];
};

export type TransactionCacheResult = {
	transactions: TransactionWithMeta[];
	total: number;
};

export class TransactionCache extends KromerCache<TransactionCacheLookup, TransactionCacheResult> {
	private parseMetadata(transactions: Transaction[]): TransactionWithMeta[] {
		return transactions.map((tx) => ({
			...tx,
			meta: kromer.transactions.parseMetadata(tx)
		}));
	}

	protected async fetch(params: TransactionCacheLookup): Promise<TransactionCacheResult | null> {
		const { addresses, ...query } = params;
		const response = await kromer.transactions.lookupTransactions(addresses, query);
		return {
			transactions: this.parseMetadata(response.transactions),
			total: response.total
		};
	}

	private filterAndSort(
		transactions: TransactionWithMeta[],
		params: TransactionCacheLookup
	): TransactionCacheResult {
		let result = transactions;

		// Filter out mined transactions if includeMined is false
		if (!params.includeMined) {
			result = result.filter((tx) => tx.from !== null);
		}

		// Get total before pagination
		const total = result.length;

		// Sort by the specified field
		const orderBy = params.orderBy ?? 'id';
		const order = params.order ?? 'DESC';

		result.sort((a, b) => {
			const aVal = a[orderBy as keyof TransactionWithMeta];
			const bVal = b[orderBy as keyof TransactionWithMeta];

			if (aVal === null || aVal === undefined) return order === 'ASC' ? -1 : 1;
			if (bVal === null || bVal === undefined) return order === 'ASC' ? 1 : -1;

			let comparison = 0;
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				comparison = aVal.localeCompare(bVal);
			} else {
				comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
			}

			return order === 'ASC' ? comparison : -comparison;
		});

		// Apply offset and limit
		const offset = params.offset ?? 0;
		const limit = params.limit ?? result.length;
		result = result.slice(offset, offset + limit);

		return { transactions: result, total };
	}

	protected async getFromCache(
		params: TransactionCacheLookup
	): Promise<TransactionCacheResult | null> {
		const db = await getDB();
		const tx = db.transaction('transactions', 'readonly');
		const store = tx.objectStore('transactions');
		const resultMap = new Map<number, TransactionWithMeta>();

		if (params.addresses.length > 0) {
			for (const address of params.addresses) {
				// Query both from and to indexes
				const fromIndex = store.index('fromIndex');
				const toIndex = store.index('toIndex');

				const [fromItems, toItems] = await Promise.all([
					fromIndex.getAll(address),
					toIndex.getAll(address)
				]);

				// Use map to deduplicate by transaction id
				for (const item of [...fromItems, ...toItems]) {
					resultMap.set(item.id, item);
				}
			}
		} else {
			// If no addresses specified, get all transactions
			const allItems = await store.getAll();
			for (const item of allItems) {
				resultMap.set(item.id, item);
			}
		}

		await tx.done;
		const result = Array.from(resultMap.values());
		if (result.length === 0) return null;

		// Fitler, sort, then parse metadata
		const filtered = this.filterAndSort(result, params);
		return {
			transactions: this.parseMetadata(filtered.transactions),
			total: resultMap.size
		};
	}

	protected async saveToCache(data: TransactionCacheResult): Promise<void> {
		const db = await getDB();
		const tx = db.transaction('transactions', 'readwrite');
		const store = tx.objectStore('transactions');
		for (const item of data.transactions) {
			await store.put(item);
		}
		await tx.done;
	}
}
