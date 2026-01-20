/**
 * ShopSync Reports API client
 * Browser-only fetching of ShopSync stats and reporting data
 * Uses the krawlet-js library
 */

import { browser } from '$app/environment';
import krawletClient from '$lib/api/krawlet';
import type {
	BaseQueryParams,
	ItemChangesParams,
	ItemChangesResponse,
	PriceChangesParams,
	PriceChangesResponse,
	ShopChangesParams,
	ShopChangesResponse,
	ShopSyncReportError,
	StatsResponse,
	SuccessfulPostsResponse,
	ValidationFailuresResponse
} from '$lib/types/shopsync-reports';

/**
 * Helper to check for browser environment
 */
function checkBrowser(): ShopSyncReportError | null {
	if (!browser) {
		return {
			ok: false,
			error: 'browser-only',
			message: 'This API can only be called from the browser'
		};
	}
	return null;
}

/**
 * Helper to handle API errors
 */
function handleError(error: unknown): ShopSyncReportError {
	return {
		ok: false,
		error: 'request-failed',
		message: error instanceof Error ? error.message : 'Request failed'
	};
}

/**
 * Get overall statistics about recorded data
 */
export async function getStats(apiKey?: string): Promise<StatsResponse | ShopSyncReportError> {
	const browserError = checkBrowser();
	if (browserError) return browserError;

	try {
		// Create a client with API key if provided
		const client = apiKey
			? new (await import('krawlet-js')).KrawletClient({ apiKey })
			: krawletClient;

		const stats = await client.reports.getStats();
		return {
			ok: true,
			data: stats as StatsResponse['data']
		};
	} catch (error) {
		return handleError(error);
	}
}

/**
 * Get validation failure records
 */
export async function getValidationFailures(
	params: BaseQueryParams = {},
	apiKey?: string
): Promise<ValidationFailuresResponse | ShopSyncReportError> {
	const browserError = checkBrowser();
	if (browserError) return browserError;

	try {
		const client = apiKey
			? new (await import('krawlet-js')).KrawletClient({ apiKey })
			: krawletClient;

		const result = await client.reports.getValidationFailures({ limit: params.limit });
		return {
			ok: true,
			count: result.count,
			data: result.records as ValidationFailuresResponse['data']
		};
	} catch (error) {
		return handleError(error);
	}
}

/**
 * Get successful POST records
 */
export async function getSuccessfulPosts(
	params: BaseQueryParams = {},
	apiKey?: string
): Promise<SuccessfulPostsResponse | ShopSyncReportError> {
	const browserError = checkBrowser();
	if (browserError) return browserError;

	try {
		const client = apiKey
			? new (await import('krawlet-js')).KrawletClient({ apiKey })
			: krawletClient;

		const result = await client.reports.getSuccessfulPosts({ limit: params.limit });
		return {
			ok: true,
			count: result.count,
			data: result.records as SuccessfulPostsResponse['data']
		};
	} catch (error) {
		return handleError(error);
	}
}

/**
 * Get shop change records
 */
export async function getShopChanges(
	params: ShopChangesParams = {},
	apiKey?: string
): Promise<ShopChangesResponse | ShopSyncReportError> {
	const browserError = checkBrowser();
	if (browserError) return browserError;

	try {
		const client = apiKey
			? new (await import('krawlet-js')).KrawletClient({ apiKey })
			: krawletClient;

		// Get in-memory shop changes
		const recentResult = await client.reports.getShopChanges({
			limit: params.limit,
			shopId: params.shopId
		});

		// Get persistent shop change logs
		const historyResult = await client.reports.getShopChangeLogs({
			limit: params.limit,
			offset: params.offset,
			shopId: params.shopId,
			since: params.since,
			until: params.until
		});

		return {
			ok: true,
			recent: recentResult.records as ShopChangesResponse['recent'],
			recentCount: recentResult.count,
			history: historyResult.logs as ShopChangesResponse['history'],
			historyCount: historyResult.count
		};
	} catch (error) {
		return handleError(error);
	}
}

/**
 * Get item change records
 */
export async function getItemChanges(
	params: ItemChangesParams = {},
	apiKey?: string
): Promise<ItemChangesResponse | ShopSyncReportError> {
	const browserError = checkBrowser();
	if (browserError) return browserError;

	try {
		const client = apiKey
			? new (await import('krawlet-js')).KrawletClient({ apiKey })
			: krawletClient;

		// Get in-memory item changes
		const recentResult = await client.reports.getItemChanges({
			limit: params.limit,
			shopId: params.shopId
		});

		// Get persistent item change logs
		const historyResult = await client.reports.getItemChangeLogs({
			limit: params.limit,
			offset: params.offset,
			shopId: params.shopId,
			since: params.since,
			until: params.until
		});

		return {
			ok: true,
			recent: recentResult.records as ItemChangesResponse['recent'],
			recentCount: recentResult.count,
			history: historyResult.logs as ItemChangesResponse['history'],
			historyCount: historyResult.count
		};
	} catch (error) {
		return handleError(error);
	}
}

/**
 * Get price change records (persistent only)
 */
export async function getPriceChanges(
	params: PriceChangesParams = {},
	apiKey?: string
): Promise<PriceChangesResponse | ShopSyncReportError> {
	const browserError = checkBrowser();
	if (browserError) return browserError;

	try {
		const client = apiKey
			? new (await import('krawlet-js')).KrawletClient({ apiKey })
			: krawletClient;

		const result = await client.reports.getPriceChangeLogs({
			limit: params.limit,
			offset: params.offset,
			shopId: params.shopId,
			since: params.since,
			until: params.until
		});

		return {
			ok: true,
			count: result.count,
			total: result.count,
			data: result.logs as PriceChangesResponse['data']
		};
	} catch (error) {
		return handleError(error);
	}
}
