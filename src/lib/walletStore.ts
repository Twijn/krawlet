import { writable } from 'svelte/store';

export type Wallet = {
	name: string;
	address: string;
	private: string;
};

type WalletStore = {
	wallets: Wallet[];
};

function createWalletStore() {
	const initial: WalletStore = {
		wallets: []
	};

	const { subscribe, set, update } = writable<WalletStore>(initial);

	// Load from localStorage on init
	const saved = localStorage.getItem('walletStore');
	if (saved) {
		try {
			const parsed = JSON.parse(saved);
			set({
				wallets: parsed.wallets || []
			});
		} catch {
			console.warn('Failed to parse walletStore from localStorage.');
		}
	}

	subscribe(($store) => {
		localStorage.setItem(
			'walletStore',
			JSON.stringify({
				wallets: $store.wallets
			})
		);
	});

	return {
		subscribe,

		addWallet: (wallet: Wallet) => {
			update((state) => ({
				...state,
				wallets: [...state.wallets, wallet]
			}));
		},

		removeWallet: (address: string) => {
			update((state) => ({
				...state,
				wallets: state.wallets.filter((w) => w.address !== address)
			}));
		},

		clearAll: () => {
			set({
				wallets: []
			});
			localStorage.removeItem('walletStore');
		}
	};
}

export const walletStore = createWalletStore();
