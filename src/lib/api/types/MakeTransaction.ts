import type { Transaction } from '$lib/api/types/Transaction';

export type MakeTransactionBody = {
	privatekey: string;
	to: string;
	amount: number;
	metadata?: string;
};

export type MakeTransactionResponse = {
	transaction: Transaction;
};
