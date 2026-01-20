import { get, writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export type FetchedStoreData<T> = {
	updated: number;
	data: T[];
};

export type FetchedResponse<T> = {
	ok: boolean;
	data: T[];
};

export type FetchFunction<T> = () => Promise<T[]>;

export default class FetchedStore<T> {
	protected initialData: FetchedStoreData<T> = {
		updated: Date.now(),
		data: []
	};
	protected store: Writable<FetchedStoreData<T>> = writable<FetchedStoreData<T>>(this.initialData);
	protected interval: NodeJS.Timeout | null = null;

	constructor(
		itemName: string,
		protected fetchFn: FetchFunction<T>,
		frequency: number = 30_000
	) {
		if (browser) {
			// Load from localStorage on init
			const saved = localStorage.getItem(itemName);
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					this.store.set({
						updated: parsed.updated ?? Date.now(),
						data: parsed.data || []
					});
				} catch {
					console.warn(`Failed to parse ${itemName} from localStorage.`);
				}
			} else {
				// Initial fetch
				this.updateItems().catch(console.error);
			}

			// Set up interval for periodic fetching
			this.interval = setInterval(async () => {
				const now = Date.now();
				const store = get(this.store);
				if (now - store.updated >= frequency) {
					this.updateItems().catch(console.error);
				}
			}, 1000);

			this.store.subscribe(($store) => {
				localStorage.setItem(
					itemName,
					JSON.stringify({
						updated: $store.updated,
						data: $store.data
					})
				);
			});
		}
	}

	protected sort(data: T[]): T[] {
		// this may be overwritten to provide custom sort options
		data.sort();
		return data;
	}

	public async updateItems(): Promise<FetchedStoreData<T>> {
		const data = {
			data: await this.fetchFn(),
			updated: Date.now()
		};
		this.sort(data.data);
		this.store.update(() => data);
		return data;
	}

	public get subscribe() {
		return this.store.subscribe;
	}

	public destroy() {
		if (this?.interval) {
			clearInterval(this.interval);
		}
	}
}
