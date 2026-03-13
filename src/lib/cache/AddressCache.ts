import type { Address, PaginatedQuery } from "kromer";
import { KromerCache } from "./KromerCache";
import kromer from "../api/kromer";
import { getDB, type KrawletDatabase } from ".";

export type AddressCacheLookup = PaginatedQuery | {
    addresses: string[];
};

export type AddressCacheResult = {
    addresses: Record<string, Address>;
    total: number;
};

export class AddressCache extends KromerCache<AddressCacheLookup, AddressCacheResult> {
    
    public static upgrade(db: KrawletDatabase): void {
        if (!db.objectStoreNames.contains('addresses')) {
            const store = db.createObjectStore('addresses', { keyPath: 'address' });
            store.createIndex("addressIndex", "address");
        }
    }

    protected async fetch(params: AddressCacheLookup): Promise<AddressCacheResult | null> {
        if ('addresses' in params && params.addresses.length > 0) {
            const response = await kromer.addresses.lookupAddresses(params.addresses, true);
            return {
                addresses: response.addresses,
                total: response.found
            };
        } else if ('offset' in params && 'limit' in params) {
            const response = await kromer.addresses.getAll({
                offset: params.offset,
                limit: params.limit
            });
            const result = response.addresses.reduce((acc, address) => {
                acc[address.address] = address;
                return acc;
            }, {} as Record<string, Address>);
            return {
                addresses: result,
                total: response.total
            };
        }
        return null;
    }

    protected async getFromCache(params: AddressCacheLookup): Promise<AddressCacheResult | null> {
        const db = await getDB();
        const tx = db.transaction("addresses", "readonly");
        const store = tx.objectStore("addresses");
        const resultMap = new Map<string, Address>();
        
        if ('addresses' in params && params.addresses.length > 0) {
            for (const address of params.addresses) {
                const addressIndex = store.index("addressIndex");
                
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
        const result = Array.from(resultMap.values());
        if (result.length === 0) return null;
    }

    protected async saveToCache(data: AddressCacheResult): Promise<void> {
        const db = await getDB();
        const tx = db.transaction("addresses", "readwrite");
        const store = tx.objectStore("addresses");
        for (const item of Object.values(data.addresses)) {
            await store.put(item);
        }
        await tx.done;
    }

}
