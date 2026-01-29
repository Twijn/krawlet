import FetchedStore from '$lib/stores/FetchedStore';
import { browser } from '$app/environment';
import krawletClient from '$lib/api/krawlet';
import type { Player as PlayerApi } from 'krawlet-js';

const itemName = 'player-wallets';
const interval = 60_000; // 1 minute

export type Player = {
	minecraftUUID: string;
	minecraftName: string;

	kromerAddress: string;

	createdDate?: string;
	updatedDate?: string;

	online: boolean;
};

// Transform krawlet-js Player to our local type
const transformPlayer = (player: PlayerApi): Player => ({
	minecraftUUID: player.minecraftUUID,
	minecraftName: player.minecraftName,
	kromerAddress: player.kromerAddress,
	createdDate: player.createdDate ?? undefined,
	updatedDate: player.updatedDate ?? undefined,
	online: player.online
});

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

const fetchPlayers = async (): Promise<Player[]> => {
	const players = await krawletClient.players.getAll();
	return players.map(transformPlayer);
};

export default new PlayerWalletStore(itemName, fetchPlayers, interval);
