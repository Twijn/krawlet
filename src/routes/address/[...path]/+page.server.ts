import { redirect } from '@sveltejs/kit';

export const load = async ({ url }) => {
	const path = url.pathname.replace('/address', '');
	throw redirect(308, `/addresses${path}`);
};
