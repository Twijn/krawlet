import kromer from '$lib/api/kromer';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const address = await kromer.address({ address: params.addressStr });

	if (!address) {
		throw fail(404, { message: 'Address not found' });
	}

	return {
		address
	};
}
