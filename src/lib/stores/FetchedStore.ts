import { get, writable } from 'svelte/store';
import { browser } from '$app/environment';

type FetchedStore<T> = {
	updated: number;
	data: T[];
};

type FetchedResponse<T> = {
	ok: boolean;
	data: T[];
};

async function fetchItems<T>(url: string): Promise<T[]> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to fetch ${url}`);
	const data = (await response.json()) as FetchedResponse<T>;
	return data.data;
}

export function createFetchedStore<T>(
	itemName: string,
	itemUrl: string,
	frequency: number = 30_000
) {
	const initial: FetchedStore<T> = {
		updated: Date.now(),
		data: []
	};

	async function updateItems() {
		return fetchItems<T>(itemUrl).then((data) => {
			// items.sort((a, b) => {
			// 	// If online status differs:
			// 	if (a.online !== b.online) {
			// 		return a.online ? -1 : 1; // online first
			// 	}
			// 	// If same online status, sort by name
			// 	return a.minecraftName.localeCompare(b.minecraftName);
			// })d;
			update(() => ({
				updated: Date.now(),
				data
			}));
		});
	}

	const { subscribe, set, update } = writable<FetchedStore<T>>(initial);

	if (browser) {
		// Load from localStorage on init
		const saved = localStorage.getItem(itemName);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				set({
					updated: parsed.updated ?? Date.now(),
					data: parsed.data || []
				});
			} catch {
				console.warn(`Failed to parse ${itemName} from localStorage.`);
			}
		} else {
			// Initial fetch
			updateItems().catch(console.error);
		}
	}

	let interval: NodeJS.Timeout;
	if (browser) {
		// Set up interval for periodic fetching
		interval = setInterval(async () => {
			const now = Date.now();
			const store = get({ subscribe });
			if (now - store.updated >= frequency) {
				updateItems().catch(console.error);
			}
		}, 1000);
	}

	subscribe(($store) => {
		if (browser) {
			localStorage.setItem(
				itemName,
				JSON.stringify({
					updated: $store.updated,
					data: $store.data
				})
			);
		}
	});
	return {
		subscribe,
		destroy: () => clearInterval(interval)
	};
}
