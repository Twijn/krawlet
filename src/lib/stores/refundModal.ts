import { writable } from 'svelte/store';
import type { Transaction } from 'kromer';

export type RefundModalState = {
	open: boolean;
	transaction: Transaction | null;
};

function createRefundModalStore() {
	const { subscribe, set } = writable<RefundModalState>({ open: false, transaction: null });

	return {
		subscribe,
		open: (transaction: Transaction) => {
			set({ open: true, transaction });
		},
		close: () => {
			set({ open: false, transaction: null });
		}
	};
}

export const refundModal = createRefundModalStore();
