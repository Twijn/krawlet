import { browser } from '$app/environment';
import { writable, type Readable, type Writable } from 'svelte/store';

export type KromerCacheGetFunction<Q, T> = (params: Q) => Promise<T>;

export type CacheResult<T> = {
	data: T | null;
	loading: boolean;
	stale: boolean;
	error: Error | null;
};

export abstract class KromerCache<Q, T> {
	private store: Writable<CacheResult<T>> | null = null;

	protected abstract fetch(params: Q): Promise<T | null>;
	protected abstract getFromCache(params: Q): Promise<T | null>;
	protected abstract saveToCache(data: T): Promise<void>;

	public update(params: Q): void {
		if (!this.store) {
			throw new Error('You must get the store before updating it!');
		}

		// Set loading state immediately
		this.store.update((state) => ({ ...state, loading: true }));

		// First, get the object from cache (if available)
		this.getFromCache(params).then((cached) => {
			if (!this.store) return;
			if (cached) {
				this.store.set({ data: cached, loading: true, stale: true, error: null });
			}
		});

		this.fetch(params)
			.then((fresh) => {
				if (!this.store) return;
				if (fresh) {
					this.store.set({ data: fresh, loading: false, stale: false, error: null });
					this.saveToCache(fresh);
				} else {
					this.store.update((state) => ({ ...state, loading: false }));
				}
			})
			.catch((error) => {
				if (!this.store) return;
				this.store.set({ data: null, loading: false, stale: false, error });
			});
	}

	public get(params: Q): Readable<CacheResult<T>> | null {
		if (this.store) return this.store;

		if (!browser) {
			return null;
		}

		const store = writable<CacheResult<T>>({
			data: null,
			loading: true,
			stale: false,
			error: null
		});

		this.store = store;

		this.update(params);

		return store;
	}
}
