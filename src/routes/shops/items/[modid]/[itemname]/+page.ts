import { error } from '@sveltejs/kit';

export async function load({ parent }) {
	const data = await parent();

	let item = null;

	if (data.listings.length === 1) {
		item = data.listings[0];
	} else if (data.listings.length > 1) {
		// If there are more than one listing that matched mod id and item name,
		// prefer the one without NBT data
		item = data.listings.find((listing) => !listing.itemNbt);
		// If there is no such item, return the first one
		// TODO: Maybe show a selection page instead in the future?
		if (!item) {
			item = data.listings[0];
		}
	}

	// This shouldn't be needed because the parent load function should
	// already throw a 404 if there are no listings, but just in case
	if (!item) {
		throw error(404, 'Item not found');
	}

	return {
		item
	};
}
