import type { Transaction } from '$lib/api/types/Transaction';
import type { APIResponse } from '$lib/api/types/APIResponse';

export type MakeTransactionBody = {
	privatekey: string;
	to: string;
	amount: number;
	metadata?: string;
};

export type MakeTransactionResponse = APIResponse & {
	transaction: Transaction;
};
