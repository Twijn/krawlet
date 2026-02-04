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

// Minimum time to wait after a failed request before retrying
const MIN_RETRY_DELAY = 10_000; // 10 seconds
const MAX_RETRY_DELAY = 60_000; // 60 seconds

/**
 * Check if the browser tab/window is currently visible/focused
 */
function isPageVisible(): boolean {
	if (!browser) return false;
	return document.visibilityState === 'visible';
}

export default class FetchedStore<T> {
	protected initialData: FetchedStoreData<T> = {
		updated: Date.now(),
		data: []
	};
	protected store: Writable<FetchedStoreData<T>> = writable<FetchedStoreData<T>>(this.initialData);
	protected interval: NodeJS.Timeout | null = null;

	// Request deduplication and error handling
	private pendingRequest: Promise<FetchedStoreData<T>> | null = null;
	private lastFailure: number = 0;
	private failureCount: number = 0;

	// Visibility change handler for cleanup
	private visibilityHandler: (() => void) | null = null;

	constructor(
		protected itemName: string,
		protected fetchFn: FetchFunction<T>,
		protected frequency: number = 30_000
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
				// Initial fetch (only if page is visible)
				if (isPageVisible()) {
					this.updateItems().catch(console.error);
				}
			}

			// Set up interval for periodic fetching
			this.interval = setInterval(async () => {
				// Skip fetching if page is not visible
				if (!isPageVisible()) return;

				const now = Date.now();
				const store = get(this.store);
				if (now - store.updated >= frequency) {
					this.updateItems().catch(console.error);
				}
			}, 1000);

			// When page becomes visible again, check if data needs updating
			this.visibilityHandler = () => {
				if (isPageVisible()) {
					const now = Date.now();
					const store = get(this.store);
					if (now - store.updated >= frequency) {
						this.updateItems().catch(console.error);
					}
				}
			};
			document.addEventListener('visibilitychange', this.visibilityHandler);

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

	/**
	 * Check if we should retry after a failure (with exponential backoff)
	 */
	private canRetryAfterFailure(): boolean {
		if (this.failureCount === 0) return true;

		const backoffDelay = Math.min(
			MIN_RETRY_DELAY * Math.pow(2, this.failureCount - 1),
			MAX_RETRY_DELAY
		);
		const timeSinceFailure = Date.now() - this.lastFailure;

		return timeSinceFailure >= backoffDelay;
	}

	/**
	 * Update items from the API. Deduplicates concurrent requests.
	 */
	public async updateItems(): Promise<FetchedStoreData<T>> {
		// If there's already a pending request, return that promise
		if (this.pendingRequest) {
			return this.pendingRequest;
		}

		// Check if we should wait due to recent failures
		if (!this.canRetryAfterFailure()) {
			// Return current data without making a new request
			return get(this.store);
		}

		// Create the request and store the promise
		this.pendingRequest = this.doFetch();

		try {
			const result = await this.pendingRequest;
			return result;
		} finally {
			// Clear the pending request when done
			this.pendingRequest = null;
		}
	}

	/**
	 * Actually perform the fetch operation
	 */
	private async doFetch(): Promise<FetchedStoreData<T>> {
		try {
			const fetchedData = await this.fetchFn();
			const data = {
				data: fetchedData,
				updated: Date.now()
			};
			this.sort(data.data);
			this.store.update(() => data);

			// Reset failure tracking on success
			this.failureCount = 0;
			this.lastFailure = 0;

			return data;
		} catch (error) {
			// Track the failure for backoff
			this.failureCount++;
			this.lastFailure = Date.now();

			console.error(`Failed to fetch ${this.itemName} (attempt ${this.failureCount}):`, error);

			// Re-throw the error so callers know it failed
			throw error;
		}
	}

	public get subscribe() {
		return this.store.subscribe;
	}

	public destroy() {
		if (this?.interval) {
			clearInterval(this.interval);
		}
		if (this.visibilityHandler) {
			document.removeEventListener('visibilitychange', this.visibilityHandler);
			this.visibilityHandler = null;
		}
	}
}
