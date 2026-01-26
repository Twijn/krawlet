import { writable } from 'svelte/store';
import type { Wallet } from '$lib/stores/settings';

export type EditWalletModalState = {
	open: boolean;
	wallet: Wallet | null;
	onSuccess?: () => void;
};

function createEditWalletModalStore() {
	const { subscribe, set } = writable<EditWalletModalState>({ open: false, wallet: null });

	return {
		subscribe,
		open: (wallet: Wallet, onSuccess?: () => void) => {
			set({ open: true, wallet, onSuccess });
		},
		close: () => {
			set({ open: false, wallet: null });
		}
	};
}

export const editWalletModal = createEditWalletModalStore();
