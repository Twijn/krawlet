import type { TransactionWithMeta, TransactionLookupQuery, Transaction } from 'kromer';
import { KromerCache } from './KromerCache';
import kromer from '../api/kromer';
import { getDB } from '.';

export type NameHistoryLookupQuery = Omit<TransactionLookupQuery, 'includeMined'> & {
	name: string;
	type: 'history' | 'transactions';
};

export type NameHistoryCacheResult = {
	transactions: TransactionWithMeta[];
	total: number;
};

export class NameHistoryCache extends KromerCache<NameHistoryLookupQuery, NameHistoryCacheResult> {
	private parseMetadata(transactions: Transaction[]): TransactionWithMeta[] {
		return transactions.map((tx) => ({
			...tx,
			meta: kromer.transactions.parseMetadata(tx)
		}));
	}

	protected async fetch(params: NameHistoryLookupQuery): Promise<NameHistoryCacheResult | null> {
		const response = await kromer.names[
			params.type === 'history' ? 'lookupNameHistory' : 'lookupNameTransactions'
		](params.name, {
			orderBy: params.orderBy,
			order: params.order,
			limit: params.limit,
			offset: params.offset
		});

		return {
			transactions: this.parseMetadata(response.transactions),
			total: response.total
		};
	}

	private filterAndSort(
		transactions: TransactionWithMeta[],
		params: NameHistoryLookupQuery
	): NameHistoryCacheResult {
		let result = transactions;

		// If type is 'history', filter to only name-related transactions
		if (params.type === 'history') {
			result = result.filter((tx) =>
				['name_purchase', 'name_a_record', 'name_transfer'].includes(tx.type)
			);
		} else if (params.type === 'transactions') {
			result = result.filter(
				(tx) => !['name_purchase', 'name_a_record', 'name_transfer'].includes(tx.type)
			);
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
		params: NameHistoryLookupQuery
	): Promise<NameHistoryCacheResult | null> {
		const db = await getDB();
		const tx = db.transaction('transactions', 'readonly');
		const store = tx.objectStore('transactions');
		const resultMap = new Map<number, TransactionWithMeta>();

		const nameIndex = store.index(params.type === 'history' ? 'nameIndex' : 'sentNameIndex');
		const items = await nameIndex.getAll(params.name);
		for (const item of items) {
			resultMap.set(item.id, item);
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

	protected async saveToCache(data: NameHistoryCacheResult): Promise<void> {
		const db = await getDB();
		const tx = db.transaction('transactions', 'readwrite');
		const store = tx.objectStore('transactions');
		for (const item of data.transactions) {
			await store.put(item);
		}
		await tx.done;
	}
}
