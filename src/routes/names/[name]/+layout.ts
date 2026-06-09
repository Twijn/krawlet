import { getKromerApi } from '$lib/api/kromer.js';
import { error } from '@sveltejs/kit';
import type { APIError } from 'kromer';

export async function load({ params, fetch }) {
	try {
		const kromer = getKromerApi({ fetchImpl: fetch });
		const name = await kromer.names.get(params.name);
		return {
			name
		};
	} catch (e) {
		const err = e as APIError;
		throw error(err.error === 'name_not_found' ? 404 : 500, err.message);
	}
}
