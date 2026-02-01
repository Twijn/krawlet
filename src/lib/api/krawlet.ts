/**
 * Krawlet API client singleton
 * Provides access to the Krawlet API through the krawlet-js library
 */

import { KrawletClient } from 'krawlet-js';
import { browser } from '$app/environment';

// Create the initial client
let _client = new KrawletClient();

/**
 * Validates that an API key has the correct format (starts with 'kraw_')
 */
export function isValidApiKey(apiKey: string): boolean {
	return apiKey.startsWith('kraw_');
}

/**
 * Updates the Krawlet client with a new API key
 * Only accepts API keys starting with 'kraw_', ignores all others
 */
export function updateKrawletApiKey(apiKey: string) {
	_client = new KrawletClient({
		apiKey: apiKey && isValidApiKey(apiKey) ? apiKey : undefined
	});
}

/**
 * Gets the current Krawlet client instance
 */
export function getKrawletClient(): KrawletClient {
	return _client;
}

/**
 * Performs a health check on the Krawlet API
 * @returns true if the API is healthy, false otherwise
 */
export async function healthCheck(): Promise<boolean> {
	try {
		const response = await _client.health.check();
		return response.status === 'healthy';
	} catch {
		return false;
	}
}

// Initialize with API key from settings (only in browser)
if (browser) {
	// Use setTimeout to avoid SSR issues with dynamic imports
	setTimeout(async () => {
		const { default: settings } = await import('$lib/stores/settings');
		const { get } = await import('svelte/store');

		// Set initial API key
		const initialSettings = get(settings);
		if (initialSettings.krawletApiKey) {
			updateKrawletApiKey(initialSettings.krawletApiKey);
		}

		// Subscribe to settings changes
		settings.subscribe((s: { krawletApiKey: string }) => {
			updateKrawletApiKey(s.krawletApiKey || '');
		});
	}, 0);
}

// Export a proxy that always uses the current client with the healthCheck function
const clientProxy = new Proxy({} as KrawletClient & { healthCheck: typeof healthCheck }, {
	get(_target, prop) {
		if (prop === 'healthCheck') {
			return healthCheck;
		}
		return (_client as unknown as Record<string | symbol, unknown>)[prop];
	}
});

export default clientProxy;
