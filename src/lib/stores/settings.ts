import { writable, get, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { APIError, KromerApi } from 'kromer';
import { getSyncNode, SYNC_NODE_OFFICIAL, updateActiveNode } from '$lib/consts';

export type Wallet = {
	name: string;
	address: string;
	private: string; // encrypted payload (JSON string) when stored
	syncNode: string; // sync node ID where this wallet was created
};

export type SettingsData = {
	// addresses
	replaceAddressesWithPlayer: boolean;
	replaceAddressesWithKnown: boolean;
	// transactions
	showMetadata: boolean;
	parseTransactionMessage: boolean;
	parsePurchaseItem: boolean;
	parsePurchaseItemQuantity: boolean;
	// names
	showOriginalOwner: boolean;
	showTransferredDate: boolean;
	// date and time
	relativeTimeEnabled: boolean;
	relativeTimeAbove7d: boolean;
	// placeholders
	simplePlaceholders: boolean;
	// wallets
	wallets: Wallet[];
	// sync node
	syncNode: string;
	showAllWalletsOption: boolean;
	showAllWalletsDefault: boolean;
	// language
	language: string;
	// API keys
	krawletApiKey: string;
};

const NAME = 'settings';

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_LENGTH_BITS = 256; // AES-256-GCM

// --- helpers: base64 <-> ArrayBuffer ---
function bufToBase64(buffer: ArrayBufferLike): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
function base64ToBuf(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

// --- crypto helpers (browser Web Crypto) ---
async function genRandomBytes(n: number): Promise<Uint8Array> {
	const b = new Uint8Array(n);
	crypto.getRandomValues(b);
	return b;
}

async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
	const enc = new TextEncoder();
	const passKey = await crypto.subtle.importKey(
		'raw',
		enc.encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);
	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: 'SHA-256'
		},
		passKey,
		{ name: 'AES-GCM', length: KEY_LENGTH_BITS },
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Encrypt a plaintext string with a password. Returns a compact JSON string
 * containing base64-encoded salt, iv, and ciphertext.
 */
export async function encryptWithPassword(password: string, plaintext: string): Promise<string> {
	const salt = await genRandomBytes(SALT_BYTES);
	const iv = await genRandomBytes(IV_BYTES);
	const key = await deriveKeyFromPassword(password, salt);
	const enc = new TextEncoder();
	const ciphertextBuf = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		enc.encode(plaintext)
	);
	const payload = {
		v: 1,
		salt: bufToBase64(salt.buffer),
		iv: bufToBase64(iv.buffer),
		ct: bufToBase64(ciphertextBuf)
	};
	return JSON.stringify(payload);
}

/**
 * Decrypts a JSON payload produced by encryptWithPassword.
 * Returns plaintext string if successful, or null on failure (bad password / tamper).
 */
export async function decryptWithPassword(
	password: string,
	payloadJson: string
): Promise<string | null> {
	try {
		const payload = JSON.parse(payloadJson);
		if (!payload || payload.v !== 1 || !payload.salt || !payload.iv || !payload.ct) return null;
		const salt = new Uint8Array(base64ToBuf(payload.salt));
		const iv = new Uint8Array(base64ToBuf(payload.iv));
		const ctBuf = base64ToBuf(payload.ct);
		const key = await deriveKeyFromPassword(password, salt);
		const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ctBuf);
		const dec = new TextDecoder();
		return dec.decode(plainBuf);
	} catch (err) {
		console.error(err);
		// decryption failed (wrong password or tampering)
		return null;
	}
}

class Settings {
	private initial: SettingsData = {
		replaceAddressesWithPlayer: true,
		replaceAddressesWithKnown: true,
		showOriginalOwner: true,
		showTransferredDate: true,
		showMetadata: true,
		parseTransactionMessage: true,
		parsePurchaseItem: true,
		parsePurchaseItemQuantity: false,
		relativeTimeEnabled: true,
		relativeTimeAbove7d: false,
		simplePlaceholders: true,
		wallets: [],
		syncNode: SYNC_NODE_OFFICIAL.id,
		showAllWalletsOption: false,
		showAllWalletsDefault: false,
		language: 'en',
		krawletApiKey: ''
	};
	private data: Writable<SettingsData>;

	constructor() {
		this.data = writable<SettingsData>(this.initial);
		// Load from localStorage on init
		if (browser) {
			const saved = localStorage.getItem(NAME);
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					if (parsed) {
						this.data.set({ ...this.initial, ...parsed });
					}

					// Update the active sync node in consts.ts
					const stored = get(this.data);
					updateActiveNode(stored.syncNode ?? SYNC_NODE_OFFICIAL.id);

					// Ensure wallets are associated with a sync node
					stored.wallets.forEach((wallet) => {
						wallet.syncNode = wallet.syncNode ?? SYNC_NODE_OFFICIAL.id;
					});
				} catch {
					console.warn('Failed to parse settings from localStorage.');
				}
			}
		}

		// Persist on change
		this.data.subscribe(($store) => {
			if (browser) {
				localStorage.setItem(NAME, JSON.stringify($store));
			}
		});
	}

	public async addWallet(
		w: Wallet | Omit<Wallet, 'syncNode'>,
		encryptionKey: string,
		kromerApi?: KromerApi
	) {
		const store = get(this.data);
		const wallet: Wallet = {
			syncNode: store.syncNode,
			...w
		};
		for (const existingWallet of store.wallets) {
			const decrypted = await decryptWithPassword(encryptionKey, existingWallet.private);
			if (existingWallet.address === wallet.address) {
				throw {
					ok: false,
					error: 'address_exists',
					message: 'You already have this address in your wallet!'
				} as APIError;
			}
			if (existingWallet.name.toLowerCase() === wallet.name.toLowerCase()) {
				throw {
					ok: false,
					error: 'name_exists',
					message: 'You already have a wallet with this name!'
				} as APIError;
			}
			if (!decrypted) {
				throw {
					ok: false,
					error: 'master_password_invalid',
					message: 'Your master password is incorrect!'
				} as APIError;
			}
		}

		// Validate the private key can authenticate with the server
		if (kromerApi) {
			try {
				const loginResponse = await kromerApi.login(wallet.private);
				if (!loginResponse.ok || loginResponse.address !== wallet.address) {
					throw {
						ok: false,
						error: 'invalid_private_key',
						message: 'The private key is invalid or cannot authenticate with the server!'
					} as APIError;
				}
			} catch (e) {
				// Re-throw API errors or wrap unknown errors
				if ((e as APIError).error) {
					throw e;
				}
				throw {
					ok: false,
					error: 'authentication_failed',
					message: 'Failed to authenticate private key with the server!'
				} as APIError;
			}
		}

		const encrypted = await encryptWithPassword(encryptionKey, wallet.private);
		const entry: Wallet = {
			name: wallet.name,
			address: wallet.address,
			private: encrypted,
			syncNode: store.syncNode
		};
		this.data.update((state) => ({ ...state, wallets: [...state.wallets, entry] }));
		return entry;
	}

	public getWallets() {
		const store = get(this.data);
		const currentSyncNodeId = getSyncNode().id ?? SYNC_NODE_OFFICIAL.id;
		return store.wallets.filter((x) => x.syncNode === currentSyncNodeId);
	}

	public removeWallet(address: string) {
		this.data.update((state) => ({
			...state,
			wallets: state.wallets.filter((w) => w.address !== address)
		}));
	}

	public async updateWallet(
		address: string,
		updates: Partial<Omit<Wallet, 'address' | 'private'>>
	) {
		this.data.update((state) => ({
			...state,
			wallets: state.wallets.map((w) =>
				w.address === address
					? {
							...w,
							...updates
						}
					: w
			)
		}));
	}

	public async decryptWallet(wallet: Wallet, encryptionKey: string) {
		if (!wallet?.private) return null;
		try {
			return await decryptWithPassword(encryptionKey, wallet.private);
		} catch {
			return null;
		}
	}

	public clearAll() {
		this.data.set(this.initial);
		if (browser) localStorage.removeItem(NAME);
	}

	public async validateMasterPassword(encryptionKey: string): Promise<boolean> {
		const store = get(this.data);
		if (store.wallets.length === 0) return true;
		for (const wallet of store.wallets) {
			const decrypted = await this.decryptWallet(wallet, encryptionKey);
			if (!decrypted) return false;
		}
		return true;
	}

	public setWallets(wallets: Wallet[]) {
		this.data.update((state) => ({
			...state,
			wallets: [...wallets]
		}));
	}

	public get subscribe() {
		return this.data.subscribe;
	}

	public get set() {
		return this.data.set;
	}

	public import(data: unknown) {
		const currentStore = get(this.data);

		if (currentStore.wallets.length > 0) {
			throw {
				ok: false,
				error: 'wallet_exists',
				message: "You can't have any wallets saved when importing!"
			} as APIError;
		}

		const importStore = data as SettingsData;

		const newData = currentStore;

		if (importStore.wallets && importStore.wallets.length > 0) {
			importStore.wallets.forEach((w) => {
				if (!currentStore.wallets.find((x) => x.address === w.address)) {
					if (!w.syncNode) {
						w.syncNode = getSyncNode().id ?? SYNC_NODE_OFFICIAL.id;
					}
					newData.wallets.push(w);
				}
			});
		}

		this.data.set(newData);
	}

	public export() {
		const store = get(this.data);
		return JSON.stringify(store);
	}
}

if (browser) {
	const oldData = localStorage.getItem('walletStore');

	if (oldData && !localStorage.getItem(NAME)) {
		try {
			const parsed = JSON.parse(oldData);
			localStorage.setItem(NAME, JSON.stringify(parsed));
		} catch {
			console.warn('Failed to parse old wallet settings from localStorage.');
		}
	}
}

export default new Settings();
