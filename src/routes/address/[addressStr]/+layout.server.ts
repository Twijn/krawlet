import kromer from '$lib/api/kromer';
import { error } from '@sveltejs/kit';
import type { APIError } from '$lib/api/types/APIError';

export async function load({ params }) {
	try {
		const address = await kromer.address({ address: params.addressStr });

		return {
			address
		};
	} catch(e) {
		const err = e as APIError;
		throw error(
			err.error === "address_not_found" ? 404 : 500,
			err.message
		);
	}
}
