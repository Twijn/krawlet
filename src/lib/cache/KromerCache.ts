import { browser } from '$app/environment';
import { writable, type Readable, type Writable } from 'svelte/store';

export type KromerCacheGetFunction<Q, T> = (params: Q) => Promise<T>;

export type CacheResult<T> = {
	data: T | null;
	loading: boolean;
	stale: boolean;
	error: Error | null;
};

export abstract class KromerCache<Q, T extends { total: number }> {
	private store: Writable<CacheResult<T>> | null = null;
	private updateToken = 0;
	private totalsByKey = new Map<string, number>();

	protected abstract fetch(params: Q): Promise<T | null>;
	protected abstract getFromCache(params: Q): Promise<T | null>;
	protected abstract saveToCache(data: T): Promise<void>;
	protected abstract getQueryKey(params: Q): string;

	protected buildQueryKey(parts: Array<string | number | boolean | null | undefined>): string {
		return parts.map((part) => encodeURIComponent(String(part ?? ''))).join('|');
	}

	protected buildRecordKey(record: Record<string, unknown>): string {
		return Object.entries(record)
			.sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
			.map(
				([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value ?? ''))}`
			)
			.join('&');
	}

	private withTotal(next: T, total: number | null | undefined): T {
		if (typeof total !== 'number' || total <= next.total) {
			return next;
		}

		return {
			...next,
			total
		};
	}

	public update(params: Q): void {
		if (!this.store) {
			throw new Error('You must get the store before updating it!');
		}

		const queryKey = this.getQueryKey(params);
		const requestToken = ++this.updateToken;

		// Set loading state immediately
		this.store.update((state) => ({ ...state, loading: true }));

		// First, get the object from cache (if available)
		this.getFromCache(params).then((cached) => {
			if (!this.store || requestToken !== this.updateToken || !cached) return;
			this.store.update((state) => ({
				...state,
				data: this.withTotal(cached, this.totalsByKey.get(queryKey)),
				loading: true,
				stale: true,
				error: null
			}));
		});

		this.fetch(params)
			.then((fresh) => {
				if (!this.store || requestToken !== this.updateToken) return;
				if (fresh) {
					this.totalsByKey.set(queryKey, fresh.total);
					this.store.set({ data: fresh, loading: false, stale: false, error: null });
					this.saveToCache(fresh);
				} else {
					this.store.update((state) => ({ ...state, loading: false }));
				}
			})
			.catch((error) => {
				if (!this.store || requestToken !== this.updateToken) return;
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
