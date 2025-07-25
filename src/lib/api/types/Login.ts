import type { APIResponse } from '$lib/api/types/APIResponse';

export type LoginResponse = APIResponse & {
	authed: boolean;
	address?: string;
};
