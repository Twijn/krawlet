import { getKromerApi } from '$lib/api/kromer';
import type { APIError } from 'kromer';
import { error } from '@sveltejs/kit';

export async function load({ params, fetch }) {
	try {
		const kromer = getKromerApi({ fetchImpl: fetch });
		const address = await kromer.addresses.get(params.addressStr);
		return {
			address
		};
	} catch (e) {
		const err = e as APIError;
		throw error(err.error === 'address_not_found' ? 404 : 500, err.message);
	}
}
