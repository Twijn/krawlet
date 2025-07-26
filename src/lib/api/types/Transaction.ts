import type { Paginated, PaginatedQuery } from '$lib/api/types/Pagination';
import type { APIResponse } from '$lib/api/types/APIResponse';

export type TransactionOrderBy =
	| 'id'
	| 'from'
	| 'to'
	| 'value'
	| 'time'
	| 'sent_name'
	| 'sent_metaname';
export type TransactionType =
	| 'mined'
	| 'transfer'
	| 'name_purchase'
	| 'name_a_record'
	| 'name_transfer';

export type TransactionQuery = PaginatedQuery & {
	excludeMined?: boolean;
	latest?: boolean;
};

export type TransactionLookup = PaginatedQuery & {
	includeMined?: boolean;
	addresses?: string[] | string;
	orderBy?: TransactionOrderBy;
	order?: 'ASC' | 'DESC';
};

export type Transaction = {
	type: TransactionType;
	id: number;
	from: string | null;
	to: string | 'a' | 'name';
	value: number;
	time: Date;
	name?: string | null;
	metadata?: string | null;
	sent_metaname?: string | null;
	sent_name?: string | null;
};

export type TransactionMetadataEntry = {
	name: string;
	value: string;
};

export type MinecraftPlayer = {
	uuid: string;
	name: string;
};

export type TransactionMetadata = {
	minecraftPlayer?: MinecraftPlayer;
	entries: TransactionMetadataEntry[];
};

export type TransactionsResponse = Paginated & {
	transactions: Transaction[];
};

export type TransactionResponse = APIResponse & {
	transaction: Transaction;
};
