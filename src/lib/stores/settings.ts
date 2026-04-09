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

export type ImportedWalletPreview = Pick<Wallet, 'name' | 'address' | 'syncNode'>;

export type WalletImportAction = 'add' | 'rename';

export type WalletImportPlanEntry = ImportedWalletPreview & {
	action: WalletImportAction;
	previousName?: string;
};

export type WalletImportPlan = {
	wallets: Wallet[];
	entries: WalletImportPlanEntry[];
	added: number;
	renamed: number;
	total: number;
};

export type WalletImportOptions = {
	reencryptToTarget?: boolean;
	sourceMasterPassword?: string;
	targetMasterPassword?: string;
};

export type WalletImportResult = {
	added: number;
	renamed: number;
	total: number;
	reencrypted: number;
};

const NAME = 'settings';

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_LENGTH_BITS = 256; // AES-256-GCM

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function createImportError(message: string, error = 'invalid_import_data'): APIError {
	return {
		ok: false,
		error,
		message
	} as APIError;
}

function normalizeImportedWallet(wallet: unknown, fallbackSyncNode: string): Wallet {
	if (!isRecord(wallet)) {
		throw createImportError('Wallet import data is malformed.');
	}

	const name = typeof wallet.name === 'string' ? wallet.name.trim() : '';
	const address = typeof wallet.address === 'string' ? wallet.address.trim() : '';
	const privateKey = typeof wallet.private === 'string' ? wallet.private : '';
	const syncNode =
		typeof wallet.syncNode === 'string' && wallet.syncNode.trim()
			? wallet.syncNode.trim()
			: fallbackSyncNode;

	if (!name || !address || !privateKey) {
		throw createImportError('Wallet import data is missing required fields.');
	}

	return {
		name,
		address,
		private: privateKey,
		syncNode
	};
}

export function validateImportedSettingsData(data: unknown): { wallets: Wallet[] } {
	if (!isRecord(data)) {
		throw createImportError('Import data is not a valid wallet export.');
	}

	const fallbackSyncNode = getSyncNode().id ?? SYNC_NODE_OFFICIAL.id;
	const rawWallets = data.wallets;
	if (rawWallets == null) {
		return { wallets: [] };
	}

	if (!Array.isArray(rawWallets)) {
		throw createImportError('Wallet import data is malformed.');
	}

	const seenAddresses = new Set<string>();
	const wallets: Wallet[] = [];

	for (const rawWallet of rawWallets) {
		const wallet = normalizeImportedWallet(rawWallet, fallbackSyncNode);
		if (seenAddresses.has(wallet.address)) {
			continue;
		}
		seenAddresses.add(wallet.address);
		wallets.push(wallet);
	}

	return { wallets };
}

export function getImportedWalletPreview(data: unknown): ImportedWalletPreview[] {
	return validateImportedSettingsData(data).wallets.map(({ name, address, syncNode }) => ({
		name,
		address,
		syncNode
	}));
}

export function createWalletImportPlan(currentWallets: Wallet[], data: unknown): WalletImportPlan {
	const { wallets: importedWallets } = validateImportedSettingsData(data);
	const mergedWallets = currentWallets.map((wallet) => ({ ...wallet }));
	const walletIndexByAddress = new Map<string, number>();
	const entries: WalletImportPlanEntry[] = [];

	for (let i = 0; i < mergedWallets.length; i++) {
		walletIndexByAddress.set(mergedWallets[i].address, i);
	}

	let added = 0;
	let renamed = 0;

	for (const importedWallet of importedWallets) {
		const existingIndex = walletIndexByAddress.get(importedWallet.address);
		if (existingIndex == null) {
			mergedWallets.push(importedWallet);
			walletIndexByAddress.set(importedWallet.address, mergedWallets.length - 1);
			entries.push({
				action: 'add',
				name: importedWallet.name,
				address: importedWallet.address,
				syncNode: importedWallet.syncNode
			});
			added += 1;
			continue;
		}

		const existingWallet = mergedWallets[existingIndex];
		mergedWallets[existingIndex] = {
			...existingWallet,
			name: importedWallet.name
		};

		entries.push({
			action: 'rename',
			name: importedWallet.name,
			address: importedWallet.address,
			syncNode: existingWallet.syncNode,
			previousName: existingWallet.name
		});
		renamed += 1;
	}

	return {
		wallets: mergedWallets,
		entries,
		added,
		renamed,
		total: entries.length
	};
}

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
	const b = new Uint8Array(new ArrayBuffer(n));
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
			salt: salt as BufferSource,
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
		{ name: 'AES-GCM', iv: iv as BufferSource },
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
		const plainBuf = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: iv as BufferSource },
			key,
			ctBuf
		);
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

	public async import(
		data: unknown,
		options: WalletImportOptions = {}
	): Promise<WalletImportResult> {
		const currentStore = get(this.data);
		const plan = createWalletImportPlan(currentStore.wallets, data);
		const nextWallets = plan.wallets.map((wallet) => ({ ...wallet }));
		let reencrypted = 0;

		if (options.reencryptToTarget) {
			const sourceMasterPassword = options.sourceMasterPassword?.trim() ?? '';
			const targetMasterPassword = options.targetMasterPassword?.trim() ?? '';

			if (!sourceMasterPassword || !targetMasterPassword) {
				throw createImportError('Master password is required to re-encrypt imported wallets.');
			}

			const existingAddresses = new Set(currentStore.wallets.map((wallet) => wallet.address));

			for (let i = 0; i < nextWallets.length; i++) {
				const wallet = nextWallets[i];
				if (existingAddresses.has(wallet.address)) {
					continue;
				}

				const privateKey = await decryptWithPassword(sourceMasterPassword, wallet.private);
				if (!privateKey) {
					throw createImportError(
						'Unable to decrypt imported wallet private keys with the provided source master password.',
						'source_master_password_invalid'
					);
				}

				nextWallets[i] = {
					...wallet,
					private: await encryptWithPassword(targetMasterPassword, privateKey)
				};
				reencrypted += 1;
			}
		}

		this.data.set({
			...currentStore,
			wallets: nextWallets
		});

		return {
			added: plan.added,
			renamed: plan.renamed,
			total: plan.total,
			reencrypted
		};
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
