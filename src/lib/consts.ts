declare const __VERSION__: string;

export const VERSION = __VERSION__;

export const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

export type SyncNode = {
	id: string;
	name: string;
	url: string;
	// To enable internal tools (create-wallet, give-money), set the API key below after forking.
	internalKey?: string;
};

// Forks can set this key to enable internal tools that call private API endpoints.
export const KROMER_INTERNAL_API_KEY = '';

export const SYNC_NODE: SyncNode = {
	id: 'kromer',
	name: 'ReconnectedCC Kromer',
	url: 'https://kromer.reconnected.cc/api/krist/',
	internalKey: KROMER_INTERNAL_API_KEY
};

export const SYNC_NODE_OFFICIAL = SYNC_NODE;

export function getSyncNode(): SyncNode {
	return SYNC_NODE;
}
