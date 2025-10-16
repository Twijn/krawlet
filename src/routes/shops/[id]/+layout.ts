import { error } from '@sveltejs/kit';
import { getShopById } from '$lib/stores/shopsync.js';

export async function load({ params }) {
	const shop = await getShopById(params.id);
	if (!shop) {
		throw error(404, 'Shop not found');
	}
	return {
		shop
	};
}
