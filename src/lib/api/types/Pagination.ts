import type { APIResponse } from '$lib/api/types/APIResponse';

export type Paginated = APIResponse & {
	count: number;
	total: number;
};

export type PaginatedQuery = {
	limit?: number;
	offset?: number;
};
