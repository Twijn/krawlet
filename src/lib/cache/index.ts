import { browser } from '$app/environment';
import type { TransactionWithMeta } from 'kromer';
import { openDB, type IDBPDatabase } from 'idb';

export * from './TransactionCache';
export * from './NameCache';
export * from './NameHistoryCache';
export * from './AddressCache';

interface KrawletDB {
	transactions: TransactionWithMeta[];
}
export type KrawletDatabase = IDBPDatabase<KrawletDB>;

let db: KrawletDatabase | null = null;

export const getDB = async (): Promise<KrawletDatabase> => {
	if (!db) {
		if (!browser) {
			throw new Error('Database can only be accessed in the browser');
		}

		db = await openDB<KrawletDB>('krawlet', 5, {
			upgrade(db, _oldVersion, _newVersion, transaction) {
				if (!db.objectStoreNames.contains('addresses')) {
					const store = db.createObjectStore('addresses', { keyPath: 'address' });
					store.createIndex('addressIndex', 'address');
				}

				if (!db.objectStoreNames.contains('names')) {
					const store = db.createObjectStore('names', { keyPath: 'name' });
					store.createIndex('nameIndex', 'name');
					store.createIndex('ownerIndex', 'owner');
					store.createIndex('originalOwnerIndex', 'originalOwner');
				}

				if (!db.objectStoreNames.contains('transactions')) {
					const store = db.createObjectStore('transactions', { keyPath: 'id' });
					store.createIndex('idIndex', 'id');
					store.createIndex('fromIndex', 'from');
					store.createIndex('toIndex', 'to');
					store.createIndex('nameIndex', 'name');
				} else {
					const store = transaction.objectStore('transactions');
					if (!store.indexNames.contains('nameIndex')) {
						store.createIndex('nameIndex', 'name');
					}
				}
			}
		});
	}
	return db;
};

if (browser) {
	db = await getDB();
}
