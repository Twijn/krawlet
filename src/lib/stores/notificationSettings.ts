/**
 * Notification Settings Store
 * Manages push notification preferences for monitoring Krist blockchain activity
 */

import { writable, get, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * A monitored address configuration
 */
export interface MonitoredAddress {
	address: string;
	label?: string;
	enabled: boolean;
}

/**
 * Event types that can trigger notifications
 */
export interface NotificationEventTypes {
	incomingTransactions: boolean;
	outgoingTransactions: boolean;
	namePurchases: boolean;
	nameTransfers: boolean;
}

/**
 * Filters to apply to notifications
 */
export interface NotificationFilters {
	minTransactionAmount?: number;
	excludeMetadata?: string[];
}

/**
 * User preferences for notification display
 */
export interface NotificationPreferences {
	sound: boolean;
	vibrate: boolean;
	showAmount: boolean;
	showSender: boolean;
	groupSimilar: boolean;
}

/**
 * Complete notification settings structure
 */
export interface NotificationSettingsData {
	enabled: boolean;
	monitoredAddresses: MonitoredAddress[];
	eventTypes: NotificationEventTypes;
	filters: NotificationFilters;
	preferences: NotificationPreferences;
}

const STORAGE_KEY = 'notification-settings';

/**
 * Default notification settings
 */
const defaultSettings: NotificationSettingsData = {
	enabled: false,
	monitoredAddresses: [],
	eventTypes: {
		incomingTransactions: true,
		outgoingTransactions: false,
		namePurchases: true,
		nameTransfers: true
	},
	filters: {
		minTransactionAmount: undefined,
		excludeMetadata: []
	},
	preferences: {
		sound: true,
		vibrate: true,
		showAmount: true,
		showSender: true,
		groupSimilar: true
	}
};

/**
 * Creates the notification settings store
 */
function createNotificationSettingsStore() {
	const data: Writable<NotificationSettingsData> = writable<NotificationSettingsData>({
		...defaultSettings
	});

	// Load from localStorage on init
	if (browser) {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (parsed) {
					// Merge with defaults to handle new properties
					data.set({ ...defaultSettings, ...parsed });
				}
			} catch {
				console.warn('Failed to parse notification settings from localStorage.');
			}
		}

		// Persist on change
		data.subscribe(($store) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify($store));
		});
	}

	return {
		subscribe: data.subscribe,
		set: data.set,
		update: data.update,

		/**
		 * Enable or disable all notifications
		 */
		setEnabled(enabled: boolean): void {
			data.update((state) => ({ ...state, enabled }));
		},

		/**
		 * Add a new address to monitor
		 */
		addMonitoredAddress(address: string, label?: string): void {
			data.update((state) => {
				// Check if already exists
				const exists = state.monitoredAddresses.some(
					(a) => a.address.toLowerCase() === address.toLowerCase()
				);
				if (exists) return state;

				return {
					...state,
					monitoredAddresses: [...state.monitoredAddresses, { address, label, enabled: true }]
				};
			});
		},

		/**
		 * Remove a monitored address
		 */
		removeMonitoredAddress(address: string): void {
			data.update((state) => ({
				...state,
				monitoredAddresses: state.monitoredAddresses.filter(
					(a) => a.address.toLowerCase() !== address.toLowerCase()
				)
			}));
		},

		/**
		 * Toggle monitoring for a specific address
		 */
		toggleAddressMonitoring(address: string, enabled: boolean): void {
			data.update((state) => ({
				...state,
				monitoredAddresses: state.monitoredAddresses.map((a) =>
					a.address.toLowerCase() === address.toLowerCase() ? { ...a, enabled } : a
				)
			}));
		},

		/**
		 * Update label for a monitored address
		 */
		updateAddressLabel(address: string, label: string): void {
			data.update((state) => ({
				...state,
				monitoredAddresses: state.monitoredAddresses.map((a) =>
					a.address.toLowerCase() === address.toLowerCase() ? { ...a, label } : a
				)
			}));
		},

		/**
		 * Set event type notification preference
		 */
		setEventType<K extends keyof NotificationEventTypes>(eventType: K, enabled: boolean): void {
			data.update((state) => ({
				...state,
				eventTypes: { ...state.eventTypes, [eventType]: enabled }
			}));
		},

		/**
		 * Set minimum transaction amount filter
		 */
		setMinTransactionAmount(amount: number | undefined): void {
			data.update((state) => ({
				...state,
				filters: { ...state.filters, minTransactionAmount: amount }
			}));
		},

		/**
		 * Add metadata to exclude from notifications
		 */
		addExcludedMetadata(metadata: string): void {
			data.update((state) => ({
				...state,
				filters: {
					...state.filters,
					excludeMetadata: [...(state.filters.excludeMetadata || []), metadata]
				}
			}));
		},

		/**
		 * Remove metadata from exclusion list
		 */
		removeExcludedMetadata(metadata: string): void {
			data.update((state) => ({
				...state,
				filters: {
					...state.filters,
					excludeMetadata: (state.filters.excludeMetadata || []).filter((m) => m !== metadata)
				}
			}));
		},

		/**
		 * Set a notification preference
		 */
		setPreference<K extends keyof NotificationPreferences>(preference: K, value: boolean): void {
			data.update((state) => ({
				...state,
				preferences: { ...state.preferences, [preference]: value }
			}));
		},

		/**
		 * Import addresses from wallets
		 */
		importFromWallets(wallets: { address: string; name: string }[]): number {
			let imported = 0;
			data.update((state) => {
				const existingAddresses = new Set(
					state.monitoredAddresses.map((a) => a.address.toLowerCase())
				);

				const newAddresses = wallets
					.filter((w) => !existingAddresses.has(w.address.toLowerCase()))
					.map((w) => ({
						address: w.address,
						label: w.name,
						enabled: true
					}));

				imported = newAddresses.length;

				return {
					...state,
					monitoredAddresses: [...state.monitoredAddresses, ...newAddresses]
				};
			});
			return imported;
		},

		/**
		 * Check if an address is being monitored
		 */
		isAddressMonitored(address: string): boolean {
			const state = get(data);
			const monitored = state.monitoredAddresses.find(
				(a) => a.address.toLowerCase() === address.toLowerCase()
			);
			return monitored?.enabled ?? false;
		},

		/**
		 * Get all enabled monitored addresses
		 */
		getEnabledAddresses(): string[] {
			const state = get(data);
			return state.monitoredAddresses.filter((a) => a.enabled).map((a) => a.address.toLowerCase());
		},

		/**
		 * Reset to default settings
		 */
		reset(): void {
			data.set({ ...defaultSettings });
		},

		/**
		 * Get current settings synchronously
		 */
		get(): NotificationSettingsData {
			return get(data);
		}
	};
}

export const notificationSettings = createNotificationSettingsStore();
