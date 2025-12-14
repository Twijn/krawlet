/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

/**
 * Krawlet Service Worker
 * Provides offline support, caching, and background sync
 */

import { build, files, version } from '$service-worker';

// Unique cache name for this version
const CACHE_NAME = `krawlet-${version}`;

// Assets to cache on install
const ASSETS = [
	...build, // Built app files
	...files // Static files
];

// API endpoints to cache with network-first strategy
const API_CACHE_NAME = `krawlet-api-${version}`;
const API_PATTERNS = [/\/api\/krist\//];

declare const self: ServiceWorkerGlobalScope;

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			// Delete old caches
			for (const key of keys) {
				if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
					await caches.delete(key);
				}
			}
			// Take control of all pages
			await self.clients.claim();
		})
	);
});

/**
 * Check if a request matches API patterns
 */
function isApiRequest(url: URL): boolean {
	return API_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

/**
 * Cache a response with a timestamp
 */
async function cacheWithTimestamp(
	cache: Cache,
	request: Request,
	response: Response
): Promise<void> {
	const headers = new Headers(response.headers);
	headers.set('sw-cached-date', new Date().toISOString());

	const clonedResponse = new Response(await response.clone().blob(), {
		status: response.status,
		statusText: response.statusText,
		headers
	});

	await cache.put(request, clonedResponse);
}

/**
 * Fetch event - handle requests with appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Skip non-GET requests
	if (event.request.method !== 'GET') return;

	// Skip cross-origin requests
	if (url.origin !== location.origin && !isApiRequest(url)) return;

	// API requests: Network-first with fallback to cache
	if (isApiRequest(url)) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(API_CACHE_NAME);

				try {
					const networkResponse = await fetch(event.request);

					// Cache successful responses
					if (networkResponse.ok) {
						await cacheWithTimestamp(cache, event.request, networkResponse);
					}

					return networkResponse;
				} catch {
					// Network failed, try cache
					const cachedResponse = await cache.match(event.request);

					if (cachedResponse) {
						// Return cached response even if stale when offline
						return cachedResponse;
					}

					// No cache, return error response
					return new Response(
						JSON.stringify({
							ok: false,
							error: 'offline',
							message: 'You are offline and this data is not cached.'
						}),
						{
							status: 503,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				}
			})()
		);
		return;
	}

	// Static assets: Cache-first with network fallback
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			const cachedResponse = await cache.match(event.request);

			if (cachedResponse) {
				return cachedResponse;
			}

			try {
				const networkResponse = await fetch(event.request);

				// Cache successful responses for same-origin requests
				if (networkResponse.ok && url.origin === location.origin) {
					cache.put(event.request, networkResponse.clone());
				}

				return networkResponse;
			} catch {
				// If both cache and network fail, return offline page for navigation requests
				if (event.request.mode === 'navigate') {
					const offlinePage = await cache.match('/offline');
					if (offlinePage) {
						return offlinePage;
					}
				}

				// Return a basic offline response
				return new Response('Offline', {
					status: 503,
					headers: { 'Content-Type': 'text/plain' }
				});
			}
		})()
	);
});

/**
 * Message event - handle messages from the main thread
 */
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data && event.data.type === 'GET_VERSION') {
		event.ports[0].postMessage({ version });
	}
});

/**
 * Push notification event - handle incoming push notifications
 */
self.addEventListener('push', (event) => {
	if (!event.data) return;

	try {
		const data = event.data.json();
		const { title, body, tag, data: notificationData } = data;

		event.waitUntil(
			self.registration.showNotification(title || 'Krawlet', {
				body: body || '',
				icon: '/web-app-manifest-192x192.png',
				badge: '/favicon-96x96.png',
				tag: tag || 'krawlet-notification',
				vibrate: [200, 100, 200],
				data: notificationData || {}
			})
		);
	} catch (error) {
		console.error('Failed to parse push notification:', error);
	}
});

/**
 * Notification click event - handle when user clicks a notification
 */
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	const urlToOpen = event.notification.data?.url || '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			// Check if there's already a window open
			for (const client of clientList) {
				if ('focus' in client) {
					return client.focus().then(() => {
						if ('navigate' in client) {
							return (client as WindowClient).navigate(urlToOpen);
						}
					});
				}
			}
			// No window open, open a new one
			if (self.clients.openWindow) {
				return self.clients.openWindow(urlToOpen);
			}
		})
	);
});

/**
 * Notification close event - track when notifications are dismissed
 */
self.addEventListener('notificationclose', (event) => {
	// Could be used for analytics or cleanup
	console.log('Notification closed:', event.notification.tag);
});
