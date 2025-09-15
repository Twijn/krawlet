import FetchedStore from '$lib/stores/FetchedStore';
import { browser } from '$app/environment';

const itemName = 'player-wallets';
const itemUrl = 'https://krawlet-api.twijn.dev/playeraddresses/all';
const interval = 30_000;

export type Player = {
	minecraftUUID: string;
	minecraftName: string;

	kromerAddress: string;

	createdDate?: string;
	updatedDate?: string;

	online: boolean;
};

// TODO: Remove this in a future release.
if (browser && localStorage.getItem('playerWalletStore')) {
	localStorage.removeItem('playerWalletStore');
}

class PlayerWalletStore extends FetchedStore<Player> {
	protected sort(data: Player[]): Player[] {
		data.sort((a, b) => {
			// If online status differs:
			if (a.online !== b.online) {
				return a.online ? -1 : 1; // online first
			}
			// If same online status, sort by name
			return a.minecraftName.localeCompare(b.minecraftName);
		});
		return data;
	}
}

export default new PlayerWalletStore(itemName, itemUrl, interval);
