import { writable } from 'svelte/store';

export type AddWalletModalState = {
	open: boolean;
	onSuccess?: () => void;
};

function createAddWalletModalStore() {
	const { subscribe, set, update } = writable<AddWalletModalState>({ open: false });

	return {
		subscribe,
		open: (onSuccess?: () => void) => {
			set({ open: true, onSuccess });
		},
		close: () => {
			set({ open: false });
		}
	};
}

export const addWalletModal = createAddWalletModalStore();
