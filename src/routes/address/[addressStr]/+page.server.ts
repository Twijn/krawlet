import kromer from '$lib/api/kromer';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const address = await kromer.address({ address: params.addressStr });

	if (!address) {
		throw error(404, { message: 'Address not found' });
	}

	return {
		address
	};
}
