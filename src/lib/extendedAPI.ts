import type { Address } from 'kromer';

const MAP_ENDPOINT = 'https://map.reconnected.cc/';
const UUID_ADDRESS_ENDPOINT = 'https://kromer.reconnected.cc/api/v1/wallet/by-player/';

export type Position = {
	x: number;
	y: number;
	z: number;
};

export type Rotation = {
	pitch: number;
	yaw: number;
	roll: number;
};

export type MapPlayer = {
	uuid: string;
	name: string;
	foreign: boolean;
	position: Position;
	rotation: Rotation;
	address?: Address;
};

export type PlayersResponse = {
	ok: boolean;
	players: MapPlayer[];
};

export type PlayerAddressResponse = {
	data: Address[];
};

export type Fetch = (url: string) => Promise<Response>;

export async function getPlayerAddresses(uuid: string, f: Fetch = fetch): Promise<Address[]> {
	const response = await f(UUID_ADDRESS_ENDPOINT + uuid);
	if (response.ok) {
		const data = (await response.json()) as PlayerAddressResponse;
		return data.data.map((x) => {
			return {
				...x,
				firstseen: new Date(x.firstseen)
			};
		});
	} else {
		throw 'Player does not exist';
	}
}

export async function getPlayers(f: Fetch = fetch): Promise<PlayersResponse> {
	const response = await f(MAP_ENDPOINT + `maps/world/live/players.json?${Date.now()}`);
	if (response.ok) {
		const data = (await response.json()) as PlayersResponse;
		for (const player of data.players) {
			try {
				const addresses = await getPlayerAddresses(player.uuid, f);
				if (addresses.length > 0) {
					player.address = addresses[0];
				}
			} catch (err) {
				console.error(err);
			}
		}
		return data;
	} else {
		throw 'Players API not available';
	}
}
