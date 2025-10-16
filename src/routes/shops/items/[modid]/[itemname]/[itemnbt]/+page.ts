import { error } from '@sveltejs/kit';

export async function load({ parent, params }) {
	const data = await parent();

	const item = data.listings.find((x) => x.itemNbt === params.itemnbt);

	if (!item) {
		throw error(404, 'Item not found');
	}

	return {
		item
	};
}
