import { getPlayers } from '$lib/extendedAPI';
import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		const response = await getPlayers();

		return json({
			...response,
			ok: true,
		});
	} catch(err) {
		console.error(err);
		return json({ ok: false, error: "Players API not available" });
	}
}
