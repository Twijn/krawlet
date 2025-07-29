import type { Paginated, PaginatedQuery } from '$lib/api/types/Pagination';
import type { Name } from '$lib/api/types/Name';
import type { APIResponse } from '$lib/api/types/APIResponse';

export type AddressQuery = {
	address: string;
	fetchNames?: boolean;
};

export type AddressesQuery = PaginatedQuery & {
	rich: boolean;
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

export type AddressResponse = APIResponse & {
	address: Address;
};

export type AddressNamesResponse = Paginated & {
	names: Name[];
};

export type AddressesResponse = Paginated & {
	addresses: Address[];
};
