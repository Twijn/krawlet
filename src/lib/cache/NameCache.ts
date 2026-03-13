import type { Name, NameLookupQuery } from "kromer";
import { KromerCache } from "./KromerCache";
import kromer from "../api/kromer";
import { getDB, type KrawletDatabase } from ".";

export type NameCacheLookup = NameLookupQuery & {
    addresses: string[];
};

export type NameCacheResult = {
    names: Name[];
    total: number;
};

export class NameCache extends KromerCache<NameCacheLookup, NameCacheResult> {
    
    public static upgrade(db: KrawletDatabase): void {
        if (!db.objectStoreNames.contains('names')) {
            const store = db.createObjectStore('names', { keyPath: 'name' });
            store.createIndex("nameIndex", "name");
            store.createIndex("ownerIndex", "owner");
            store.createIndex("originalOwnerIndex", "originalOwner");
        }
    }

    protected async fetch(params: NameCacheLookup): Promise<NameCacheResult | null> {
        const { addresses, ...query } = params;
        const response = await kromer.names.lookupNames(addresses, query);
        return {
            names: response.names,
            total: response.total
        };
    }

    private filterAndSort(names: Name[], params: NameCacheLookup): NameCacheResult {
        let result = names;

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

        return { names: result, total };
    }

    protected async getFromCache(params: NameCacheLookup): Promise<NameCacheResult | null> {
        const db = await getDB();
        const tx = db.transaction("names", "readonly");
        const store = tx.objectStore("names");
        const resultMap = new Map<string, Name>();
        
        if (params.addresses.length > 0) {
            for (const address of params.addresses) {
                // Query both from and to indexes
                const ownerIndex = store.index("ownerIndex");
                const originalOwnerIndex = store.index("originalOwnerIndex");
                
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
        const result = Array.from(resultMap.values());
        if (result.length === 0) return null;
        
        // Fitler, sort, then parse metadata
        const filtered = this.filterAndSort(result, params);
        return {
            names: filtered.names,
            total: resultMap.size
        };
    }

    protected async saveToCache(data: NameCacheResult): Promise<void> {
        const db = await getDB();
        const tx = db.transaction("names", "readwrite");
        const store = tx.objectStore("names");
        for (const item of data.names) {
            await store.put(item);
        }
        await tx.done;
    }

}
