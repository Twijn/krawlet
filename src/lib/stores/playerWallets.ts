import { createFetchedStore } from '$lib/stores/FetchedStore';
import { browser } from '$app/environment';

const itemName = 'player-wallets';
const itemUrl = 'https://krawlet-api.twijn.dev/playeraddresses/all';

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

export default createFetchedStore<Player>(itemName, itemUrl);
