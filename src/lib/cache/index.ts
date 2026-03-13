import { browser } from "$app/environment";
import type { TransactionWithMeta } from "kromer";
import { openDB, type IDBPDatabase } from "idb";

import { TransactionCache } from "./TransactionCache";
import { NameCache } from "./NameCache";

export * from "./TransactionCache";
export * from "./NameCache";
interface KrawletDB {
    transactions: TransactionWithMeta[],
}
export type KrawletDatabase = IDBPDatabase<KrawletDB>;

let db: KrawletDatabase | null = null;

export const getDB = async (): Promise<KrawletDatabase> => {
    if (!db) {
        if (!browser) {
            throw new Error("Database can only be accessed in the browser");
        }
        
        db = await openDB<KrawletDB>('krawlet', 3, {
            upgrade(db) {
                NameCache.upgrade(db);
                TransactionCache.upgrade(db);
            }
        });
    }
    return db;
}

if (browser) {
    db = await getDB();
}