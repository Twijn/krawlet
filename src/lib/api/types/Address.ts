import type { Paginated, PaginatedQuery } from '$lib/api/types/Pagination';
import type { Name } from '$lib/api/types/Name';

export type AddressQuery = {
	address: string;
	fetchNames?: boolean;
};

export type AddressNamesQuery = PaginatedQuery & {
	address: string;
};

export type AddressTransactionQuery = PaginatedQuery & {
	address: string;
};

export type Address = {
	address: string;
	balance: number;
	totalin: number;
	totalout: number;
	firstseen: Date;
};

export type AddressResponse = {
	address: Address;
};

export type AddressNamesResponse = Paginated & {
	names: Name[];
};
