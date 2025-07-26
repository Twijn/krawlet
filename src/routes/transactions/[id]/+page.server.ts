import type { APIError } from '$lib/api/types/APIError';
import kromer from '$lib/api/kromer';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	try {
		const transaction = await kromer.transaction(params.id);
		return {
			transaction
		};
	} catch (e) {
		const err = e as APIError;
		throw error(err.error === 'transaction_not_found' ? 404 : 500, err.message);
	}
}
