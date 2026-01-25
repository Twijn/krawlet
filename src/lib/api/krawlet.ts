/**
 * Krawlet API client singleton
 * Provides access to the Krawlet API through the krawlet-js library
 */

import { KrawletClient } from 'krawlet-js';
import { browser } from '$app/environment';

// Create the initial client
let _client = new KrawletClient();

/**
 * Updates the Krawlet client with a new API key
 */
export function updateKrawletApiKey(apiKey: string) {
	_client = new KrawletClient({
		apiKey: apiKey || undefined
	});
}

/**
 * Gets the current Krawlet client instance
 */
export function getKrawletClient(): KrawletClient {
	return _client;
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

// Export a proxy that always uses the current client
const clientProxy = new Proxy({} as KrawletClient, {
	get(_target, prop) {
		return (_client as unknown as Record<string | symbol, unknown>)[prop];
	}
});

export default clientProxy;
