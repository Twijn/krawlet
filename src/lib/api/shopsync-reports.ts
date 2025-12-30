/**
 * ShopSync Reports API client
 * Browser-only fetching of ShopSync stats and reporting data
 */

import { browser } from '$app/environment';
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

const BASE_URL = 'https://krawlet-api.twijn.dev/shopsync/reports';

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params: object = {}): string {
	const url = new URL(`${BASE_URL}/${endpoint}`);

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			url.searchParams.set(key, String(value));
		}
	}

	return url.toString();
}

/**
 * Make a fetch request to the reports API
 */
async function fetchReports<T>(
	endpoint: string,
	params: object = {},
	apiKey?: string
): Promise<T | ShopSyncReportError> {
	if (!browser) {
		return {
			ok: false,
			error: 'browser-only',
			message: 'This API can only be called from the browser'
		};
	}

	try {
		const headers: HeadersInit = {
			'Content-Type': 'application/json'
		};

		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`;
		}

		const response = await fetch(buildUrl(endpoint, params), { headers });

		if (!response.ok) {
			const errorData = (await response.json().catch(() => ({}))) as Partial<ShopSyncReportError>;
			return {
				ok: false,
				error: errorData.error ?? 'request-failed',
				message: errorData.message ?? `Request failed with status ${response.status}`
			};
		}

		return (await response.json()) as T;
	} catch (error) {
		return {
			ok: false,
			error: 'network-error',
			message: error instanceof Error ? error.message : 'Network request failed'
		};
	}
}

/**
 * Get overall statistics about recorded data
 */
export async function getStats(apiKey?: string): Promise<StatsResponse | ShopSyncReportError> {
	return fetchReports<StatsResponse>('stats', {}, apiKey);
}

/**
 * Get validation failure records
 */
export async function getValidationFailures(
	params: BaseQueryParams = {},
	apiKey?: string
): Promise<ValidationFailuresResponse | ShopSyncReportError> {
	return fetchReports<ValidationFailuresResponse>('validation-failures', params, apiKey);
}

/**
 * Get successful POST records
 */
export async function getSuccessfulPosts(
	params: BaseQueryParams = {},
	apiKey?: string
): Promise<SuccessfulPostsResponse | ShopSyncReportError> {
	return fetchReports<SuccessfulPostsResponse>('successful-posts', params, apiKey);
}

/**
 * Get shop change records
 */
export async function getShopChanges(
	params: ShopChangesParams = {},
	apiKey?: string
): Promise<ShopChangesResponse | ShopSyncReportError> {
	return fetchReports<ShopChangesResponse>('shop-changes', params, apiKey);
}

/**
 * Get item change records
 */
export async function getItemChanges(
	params: ItemChangesParams = {},
	apiKey?: string
): Promise<ItemChangesResponse | ShopSyncReportError> {
	return fetchReports<ItemChangesResponse>('item-changes', params, apiKey);
}

/**
 * Get price change records (persistent only)
 */
export async function getPriceChanges(
	params: PriceChangesParams = {},
	apiKey?: string
): Promise<PriceChangesResponse | ShopSyncReportError> {
	return fetchReports<PriceChangesResponse>('price-changes', params, apiKey);
}
