// walletStore.ts
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { APIError } from 'kromer';

export type Wallet = {
	name: string;
	address: string;
	private: string; // encrypted payload (JSON string) when stored
};

type WalletStore = {
	wallets: Wallet[];
};

const PBKDF2_ITERATIONS = 100_000; // reasonable default
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

// --- Wallet store using encrypted private keys ---
function createWalletStore() {
	const initial: WalletStore = { wallets: [] };
	const { subscribe, set, update } = writable<WalletStore>(initial);

	// Load from localStorage on init
	if (browser) {
		const saved = localStorage.getItem('walletStore');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				set({ wallets: parsed.wallets || [] });
			} catch {
				console.warn('Failed to parse walletStore from localStorage.');
			}
		}
	}

	// Persist on change
	subscribe(($store) => {
		if (browser) {
			localStorage.setItem('walletStore', JSON.stringify({ wallets: $store.wallets }));
		}
	});

	return {
		subscribe,

		addWallet: async (
			wallet: { name: string; address: string; private: string },
			encryptionKey: string
		) => {
			const store = get(walletStore);
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
			const encrypted = await encryptWithPassword(encryptionKey, wallet.private);
			const entry: Wallet = { name: wallet.name, address: wallet.address, private: encrypted };
			update((state) => ({ ...state, wallets: [...state.wallets, entry] }));
			return entry;
		},

		removeWallet: (address: string) => {
			update((state) => ({
				...state,
				wallets: state.wallets.filter((w) => w.address !== address)
			}));
		},

		decryptWallet: async (wallet: Wallet, encryptionKey: string): Promise<string | null> => {
			if (!wallet) return null;
			try {
				return await decryptWithPassword(encryptionKey, wallet.private);
			} catch {
				return null;
			}
		},

		clearAll: () => {
			set({ wallets: [] });
			if (browser) localStorage.removeItem('walletStore');
		}
	};
}

export const walletStore = createWalletStore();
