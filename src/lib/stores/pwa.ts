/**
 * PWA (Progressive Web App) utilities and stores for Krawlet
 * Handles install prompts, online/offline status, and service worker updates
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * BeforeInstallPromptEvent interface for TypeScript
 */
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Store for the install prompt event
 * Will be set when the browser fires beforeinstallprompt
 */
export const installPrompt = writable<BeforeInstallPromptEvent | null>(null);

/**
 * Store for whether the app is already installed as a PWA
 */
export const isInstalled = writable(false);

/**
 * Store for online/offline status
 */
export const isOnline = writable(true);

/**
 * Store for whether an update is available
 */
export const updateAvailable = writable(false);

/**
 * Store for whether the install prompt has been dismissed by the user
 */
export const installDismissed = writable(false);

/**
 * Store for notification permission status
 */
export const notificationPermission = writable<NotificationPermission>(
	browser && 'Notification' in window ? Notification.permission : 'denied'
);

/**
 * Key for storing install dismissed preference
 */
const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';

/**
 * Initialize PWA features
 * Call this in the root layout on mount
 */
export function initPWA(): () => void {
	if (!browser) return () => {};

	const cleanupFunctions: (() => void)[] = [];

	// Register the service worker (only in production - dev mode doesn't compile it properly)
	if ('serviceWorker' in navigator && import.meta.env.PROD) {
		navigator.serviceWorker
			.register('/service-worker.js', { scope: '/' })
			.then((registration) => {
				console.log('Service worker registered:', registration.scope);

				// Check for updates periodically (every hour)
				setInterval(
					() => {
						registration.update();
					},
					60 * 60 * 1000
				);
			})
			.catch((error) => {
				console.error('Service worker registration failed:', error);
			});
	}

	// Check if already installed
	if (window.matchMedia('(display-mode: standalone)').matches) {
		isInstalled.set(true);
	}

	// Check if user previously dismissed the install prompt
	const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
	if (dismissed === 'true') {
		installDismissed.set(true);
	}

	// Handle beforeinstallprompt event
	function handleBeforeInstallPrompt(e: Event) {
		e.preventDefault();
		installPrompt.set(e as BeforeInstallPromptEvent);
	}

	// Handle appinstalled event
	function handleAppInstalled() {
		isInstalled.set(true);
		installPrompt.set(null);
	}

	// Handle online/offline events
	function handleOnline() {
		isOnline.set(true);
	}

	function handleOffline() {
		isOnline.set(false);
	}

	// Set initial online status
	isOnline.set(navigator.onLine);

	// Add event listeners
	window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
	window.addEventListener('appinstalled', handleAppInstalled);
	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);

	cleanupFunctions.push(() => {
		window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		window.removeEventListener('appinstalled', handleAppInstalled);
		window.removeEventListener('online', handleOnline);
		window.removeEventListener('offline', handleOffline);
	});

	// Listen for service worker updates
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.ready.then((registration) => {
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							updateAvailable.set(true);
						}
					});
				}
			});
		});
	}

	// Return cleanup function
	return () => {
		cleanupFunctions.forEach((fn) => fn());
	};
}

/**
 * Trigger the install prompt
 * @returns Promise that resolves to whether the user accepted the install
 */
export async function promptInstall(): Promise<boolean> {
	const prompt = get(installPrompt);
	if (!prompt) return false;

	try {
		await prompt.prompt();
		const { outcome } = await prompt.userChoice;

		if (outcome === 'accepted') {
			installPrompt.set(null);
			return true;
		}

		return false;
	} catch (error) {
		console.error('Install prompt failed:', error);
		return false;
	}
}

/**
 * Dismiss the install prompt
 * Saves preference to localStorage
 */
export function dismissInstall(): void {
	installDismissed.set(true);
	if (browser) {
		localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
	}
}

/**
 * Reset the install dismissed preference
 */
export function resetInstallDismissed(): void {
	installDismissed.set(false);
	if (browser) {
		localStorage.removeItem(INSTALL_DISMISSED_KEY);
	}
}

/**
 * Reload the app to apply updates
 * Sends SKIP_WAITING to the service worker first to activate the new version
 */
export async function applyUpdate(): Promise<void> {
	if (!browser) return;

	if ('serviceWorker' in navigator) {
		const registration = await navigator.serviceWorker.ready;
		
		// Tell the waiting service worker to take over
		if (registration.waiting) {
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}
		
		// Listen for the controller to change, then reload
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			window.location.reload();
		});
		
		// Fallback: reload after a short delay if controllerchange doesn't fire
		setTimeout(() => {
			window.location.reload();
		}, 1000);
	} else {
		window.location.reload();
	}
}

/**
 * Check if the app can work offline
 * @returns Whether service worker is registered and active
 */
export async function canWorkOffline(): Promise<boolean> {
	if (!browser || !('serviceWorker' in navigator)) return false;

	try {
		const registration = await navigator.serviceWorker.ready;
		return registration.active !== null;
	} catch {
		return false;
	}
}
