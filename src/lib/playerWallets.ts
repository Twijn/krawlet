import { get, writable } from 'svelte/store';
import { browser } from '$app/environment';

const itemName = 'playerWalletStore';

export type Player = {
	minecraftUUID: string;
	minecraftName: string;

	kromerAddress: string;

	createdDate?: string;
	updatedDate?: string;

	online: boolean;
};

type PlayerStore = {
	updated: number;
	players: Player[];
};

type PlayersResponse = {
	ok: boolean;
	data: Player[];
};

async function fetchPlayers(): Promise<Player[]> {
	const response = await fetch('https://krawlet-api.twijn.dev/playeraddresses/all');
	if (!response.ok) throw new Error('Failed to fetch players');
	const data = (await response.json()) as PlayersResponse;
	return data.data;
}

function createStore() {
	const initial: PlayerStore = {
		updated: Date.now(),
		players: []
	};

	async function updatePlayers() {
		return fetchPlayers()
			.then((players) => {
				players.sort((a, b) => {
					// If online status differs:
					if (a.online !== b.online) {
						return a.online ? -1 : 1; // online first
					}
					// If same online status, sort by name
					return a.minecraftName.localeCompare(b.minecraftName);
				});
				update(() => ({
					updated: Date.now(),
					players
				}));
			});
	}

	const { subscribe, set, update } = writable<PlayerStore>(initial);

	if (browser) {
		// Load from localStorage on init
		const saved = localStorage.getItem(itemName);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				set({
					updated: parsed.updated ?? Date.now(),
					players: parsed.players || []
				});
			} catch {
				console.warn(`Failed to parse ${itemName} from localStorage.`);
			}
		}
	}

	if (browser && get({ subscribe }).players.length === 0) {
		// Initial fetch
		updatePlayers().catch(console.error);
	}

	let interval: NodeJS.Timeout;
	if (browser) {
		// Set up interval for periodic fetching
		interval = setInterval(async () => {
			const now = Date.now();
			const store = get({ subscribe });
			if (now - store.updated >= 30_000) {
				updatePlayers().catch(console.error);
			}
		}, 1000);
	}

	subscribe(($store) => {
		if (browser) {
			localStorage.setItem(
				itemName,
				JSON.stringify({
					updated: $store.updated,
					players: $store.players
				})
			);
		}
	});
	return {
		subscribe,
		destroy: () => clearInterval(interval)
	};
}

export const playerWalletStore = createStore();
