import { error } from '@sveltejs/kit';
import { getListings } from '$lib/stores/shopsync.js';

export async function load({ params }) {
	const listings = await getListings(params.itemname, params.modid);

	if (!listings || listings.length === 0) {
		throw error(404, 'Item not found');
	}

	return {
		listings
	};
}
