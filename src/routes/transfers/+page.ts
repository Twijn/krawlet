import type { PageLoad } from './$types';
import { getKrawletClient } from '$lib/api/krawlet';

export const ssr = false;

type RouteTransfer = {
	id: string;
	status: string;
	error: string | null;
	workerId: number | null;
	fromUUID: string | null;
	fromName: string | null;
	toUUID: string | null;
	toName: string | null;
	itemName: string | null;
	itemNbt: string | null;
	quantity: number | null;
	quantityTransferred: number;
	timestamp: string;
};

function asString(value: unknown): string | null {
	return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeTransfer(value: unknown): RouteTransfer {
	const raw = value as Record<string, unknown>;

	return {
		id: asString(raw.id) ?? '',
		status: asString(raw.status) ?? 'unknown',
		error: asString(raw.error),
		workerId: asNumber(raw.workerId),
		fromUUID: asString(raw.fromUUID),
		fromName: asString(raw.fromName),
		toUUID: asString(raw.toUUID),
		toName: asString(raw.toName),
		itemName: asString(raw.itemName),
		itemNbt: asString(raw.itemNbt),
		quantity: asNumber(raw.quantity),
		quantityTransferred: asNumber(raw.quantityTransferred) ?? 0,
		timestamp: asString(raw.timestamp) ?? new Date(0).toISOString()
	};
}

export const load: PageLoad = async () => {
	const client = getKrawletClient();

	try {
		const rawTransfers = await client.transfers.getAll();
		const transfers = rawTransfers.map(normalizeTransfer);
		return {
			transfers,
			transfersError: null
		};
	} catch (error) {
		return {
			transfers: [],
			transfersError: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};
