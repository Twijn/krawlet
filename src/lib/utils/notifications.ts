/**
 * Notification Utilities
 * Provides functions for handling push notifications in the PWA
 */

import { browser } from '$app/environment';
import {
	notificationSettings,
	type NotificationSettingsData
} from '$lib/stores/notificationSettings';
import { t } from '$lib/i18n';
import type { TransactionWithMeta } from 'kromer';

/**
 * Extended notification options that include vibrate pattern
 */
export interface ExtendedNotificationOptions extends NotificationOptions {
	vibrate?: number | number[];
	data?: Record<string, unknown>;
}

/**
 * Notification data structure for transactions
 */
export interface TransactionNotificationData {
	type: 'incoming' | 'outgoing';
	title: string;
	body: string;
	tag: string;
	data: {
		url: string;
		transactionId: number;
		amount: number;
		from: string | null;
		to: string;
	};
}

/**
 * Notification data structure for names
 */
export interface NameNotificationData {
	type: 'purchase' | 'transfer';
	title: string;
	body: string;
	tag: string;
	data: {
		url: string;
		name: string;
		amount?: number;
		from?: string;
		to?: string;
	};
}

/**
 * WebSocket event types we care about
 */
export interface WebSocketTransactionEvent {
	type: 'transaction';
	transaction: TransactionWithMeta;
}

export interface WebSocketNameEvent {
	type: 'name';
	event: 'purchased' | 'transferred';
	name: string;
	owner: string;
	previousOwner?: string;
	cost?: number;
}

export type WebSocketEvent = WebSocketTransactionEvent | WebSocketNameEvent;

/**
 * Request notification permission from the user
 * @returns Promise resolving to the permission state
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!browser) return 'denied';

	if (!('Notification' in window)) {
		console.warn('This browser does not support notifications');
		return 'denied';
	}

	try {
		const permission = await Notification.requestPermission();
		return permission;
	} catch (error) {
		console.error('Failed to request notification permission:', error);
		return 'denied';
	}
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
	if (!browser) return 'denied';

	if (!('Notification' in window)) {
		return 'denied';
	}

	return Notification.permission;
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
	if (!browser) return false;
	return 'Notification' in window;
}

/**
 * Check if service worker push is supported
 */
export function isPushSupported(): boolean {
	if (!browser) return false;
	return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Show a notification using the Notification API (foreground)
 * @param title - Notification title
 * @param options - Notification options
 */
export function showNotification(
	title: string,
	options: ExtendedNotificationOptions
): Notification | null {
	if (!browser) return null;

	if (Notification.permission !== 'granted') {
		console.warn('Notification permission not granted');
		return null;
	}

	const settings = notificationSettings.get();

	// Create a copy to avoid mutating the original
	const notificationOptions: ExtendedNotificationOptions = { ...options };

	// Apply vibration preference
	if (!settings.preferences.vibrate) {
		delete notificationOptions.vibrate;
	}

	// Apply sound preference (silent mode)
	if (!settings.preferences.sound) {
		notificationOptions.silent = true;
	}

	try {
		const notification = new Notification(title, {
			icon: '/images/icon-192.png',
			badge: '/images/icon-72.png',
			...notificationOptions
		} as NotificationOptions);

		// Handle click to open relevant page
		notification.onclick = () => {
			if (notificationOptions.data?.url && typeof notificationOptions.data.url === 'string') {
				window.focus();
				window.location.href = notificationOptions.data.url;
			}
			notification.close();
		};

		return notification;
	} catch (error) {
		console.error('Failed to show notification:', error);
		return null;
	}
}

/**
 * Show notification via service worker (background)
 */
export async function showServiceWorkerNotification(
	title: string,
	options: ExtendedNotificationOptions
): Promise<void> {
	if (!browser) return;

	if (!('serviceWorker' in navigator)) {
		console.warn('Service worker not supported');
		return;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const settings = notificationSettings.get();

		// Create a copy to avoid mutating the original
		const notificationOptions: ExtendedNotificationOptions = { ...options };

		// Apply preferences
		if (!settings.preferences.vibrate) {
			delete notificationOptions.vibrate;
		}
		if (!settings.preferences.sound) {
			notificationOptions.silent = true;
		}

		await registration.showNotification(title, {
			icon: '/images/icon-192.png',
			badge: '/images/icon-72.png',
			...notificationOptions
		} as NotificationOptions);
	} catch (error) {
		console.error('Failed to show service worker notification:', error);
	}
}

/**
 * Format a transaction into notification data
 */
export function formatTransactionNotification(
	tx: TransactionWithMeta,
	isIncoming: boolean,
	settings: NotificationSettingsData
): TransactionNotificationData {
	const amount = tx.value;
	const from = tx.from || null;
	const to = tx.to;

	let title: string;
	let body: string;

	if (isIncoming) {
		title = settings.preferences.showAmount
			? t('pushNotifications.receivedAmount', { amount: amount.toLocaleString() })
			: t('pushNotifications.receivedTransaction');

		if (settings.preferences.showSender && from) {
			// Check if there's a name associated
			const senderDisplay = tx.sent_name ? `${tx.sent_name}.kst` : from;
			body = t('pushNotifications.from', { sender: senderDisplay });
		} else {
			body = t('pushNotifications.newIncomingTransaction');
		}
	} else {
		title = settings.preferences.showAmount
			? t('pushNotifications.sentAmount', { amount: amount.toLocaleString() })
			: t('pushNotifications.sentTransaction');

		const recipientDisplay = tx.sent_name ? `${tx.sent_name}.kst` : to;
		body = t('pushNotifications.to', { recipient: recipientDisplay });
	}

	return {
		type: isIncoming ? 'incoming' : 'outgoing',
		title,
		body,
		tag: settings.preferences.groupSimilar ? `transaction-${isIncoming ? 'in' : 'out'}` : `tx-${tx.id}`,
		data: {
			url: `/transactions/${tx.id}`,
			transactionId: tx.id,
			amount,
			from,
			to
		}
	};
}

/**
 * Format a name event into notification data
 */
export function formatNameNotification(
	name: string,
	event: 'purchased' | 'transferred',
	details: { owner?: string; previousOwner?: string; cost?: number }
): NameNotificationData {
	let title: string;
	let body: string;

	if (event === 'purchased') {
		title = t('pushNotifications.namePurchased', { name: `${name}.kst` });
		body = details.cost
			? t('pushNotifications.nameCost', { amount: details.cost.toLocaleString() })
			: '';
	} else {
		title = t('pushNotifications.nameTransferred', { name: `${name}.kst` });
		if (details.owner) {
			body = t('pushNotifications.to', { recipient: details.owner });
		} else if (details.previousOwner) {
			body = t('pushNotifications.from', { sender: details.previousOwner });
		} else {
			body = '';
		}
	}

	return {
		type: event === 'purchased' ? 'purchase' : 'transfer',
		title,
		body,
		tag: `name-${name}`,
		data: {
			url: `/names/${name}`,
			name,
			amount: details.cost,
			from: details.previousOwner,
			to: details.owner
		}
	};
}

/**
 * Check if an event should trigger a notification based on settings
 */
export function shouldNotify(
	event: WebSocketTransactionEvent,
	settings: NotificationSettingsData
): { shouldNotify: boolean; isIncoming: boolean } {
	// Check if notifications are enabled
	if (!settings.enabled) {
		return { shouldNotify: false, isIncoming: false };
	}

	const tx = event.transaction;
	const enabledAddresses = settings.monitoredAddresses
		.filter((a) => a.enabled)
		.map((a) => a.address.toLowerCase());

	if (enabledAddresses.length === 0) {
		return { shouldNotify: false, isIncoming: false };
	}

	// Check if this transaction involves a monitored address
	const fromLower = tx.from?.toLowerCase();
	const toLower = tx.to.toLowerCase();

	const isIncoming = enabledAddresses.includes(toLower);
	const isOutgoing = fromLower ? enabledAddresses.includes(fromLower) : false;

	// Check event type settings
	if (isIncoming && !settings.eventTypes.incomingTransactions) {
		return { shouldNotify: false, isIncoming: true };
	}
	if (isOutgoing && !settings.eventTypes.outgoingTransactions) {
		return { shouldNotify: false, isIncoming: false };
	}

	if (!isIncoming && !isOutgoing) {
		return { shouldNotify: false, isIncoming: false };
	}

	// Check minimum amount filter
	if (
		settings.filters.minTransactionAmount !== undefined &&
		tx.value < settings.filters.minTransactionAmount
	) {
		return { shouldNotify: false, isIncoming };
	}

	// Check excluded metadata
	if (settings.filters.excludeMetadata && settings.filters.excludeMetadata.length > 0 && tx.metadata) {
		const metadataLower = tx.metadata.toLowerCase();
		for (const excluded of settings.filters.excludeMetadata) {
			if (metadataLower.includes(excluded.toLowerCase())) {
				return { shouldNotify: false, isIncoming };
			}
		}
	}

	return { shouldNotify: true, isIncoming };
}

/**
 * Send a test notification
 */
export function sendTestNotification(): boolean {
	if (!browser) return false;

	if (Notification.permission !== 'granted') {
		return false;
	}

	const notification = showNotification(t('pushNotifications.testTitle'), {
		body: t('pushNotifications.testBody'),
		tag: 'test-notification',
		vibrate: [200, 100, 200],
		data: {
			url: '/settings'
		}
	});

	return notification !== null;
}

/**
 * Rate limiting for notifications to prevent spam
 */
const notificationTimes: Map<string, number> = new Map();
const NOTIFICATION_COOLDOWN = 1000; // 1 second minimum between same-tagged notifications

/**
 * Check if a notification can be sent (rate limiting)
 */
export function canSendNotification(tag: string): boolean {
	const now = Date.now();
	const lastTime = notificationTimes.get(tag);

	if (lastTime && now - lastTime < NOTIFICATION_COOLDOWN) {
		return false;
	}

	notificationTimes.set(tag, now);

	// Clean up old entries periodically
	if (notificationTimes.size > 100) {
		const threshold = now - NOTIFICATION_COOLDOWN * 10;
		for (const [key, time] of notificationTimes) {
			if (time < threshold) {
				notificationTimes.delete(key);
			}
		}
	}

	return true;
}

/**
 * Process a transaction event and show notification if appropriate
 */
export function processTransactionForNotification(tx: TransactionWithMeta): void {
	const settings = notificationSettings.get();
	const result = shouldNotify({ type: 'transaction', transaction: tx }, settings);

	if (!result.shouldNotify) return;

	const notificationData = formatTransactionNotification(tx, result.isIncoming, settings);

	if (!canSendNotification(notificationData.tag)) return;

	// Check if document is visible (app is in foreground)
	if (document.visibilityState === 'visible') {
		showNotification(notificationData.title, {
			body: notificationData.body,
			tag: notificationData.tag,
			vibrate: [200, 100, 200],
			data: notificationData.data
		});
	} else {
		// Use service worker for background notifications
		showServiceWorkerNotification(notificationData.title, {
			body: notificationData.body,
			tag: notificationData.tag,
			vibrate: [200, 100, 200],
			data: notificationData.data
		});
	}
}
