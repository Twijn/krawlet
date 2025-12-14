/**
 * WebSocket store for real-time updates
 * Handles connection to the Kromer WebSocket API for live transaction updates
 */

import { writable, get, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { notifications } from './notifications';
import { t } from '$lib/i18n';
import type { TransactionWithMeta } from 'kromer';
import kromer from '$lib/api/kromer';
import { processTransactionForNotification } from '$lib/utils/notifications';

/**
 * WebSocket connection states
 */
export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Creates a WebSocket store for managing real-time connections
 */
function createWebSocketStore() {
	const state = writable<WebSocketState>('disconnected');
	const lastTransaction = writable<TransactionWithMeta | null>(null);

	let wsClient: ReturnType<typeof kromer.createWsClient> | null = null;
	let cleanupFns: (() => void)[] = [];

	/**
	 * Connect to the WebSocket server
	 */
	function connect(): void {
		if (!browser) return;
		if (wsClient) return;

		state.set('connecting');

		try {
			// Create WebSocket client using Kromer package
			wsClient = kromer.createWsClient(undefined, ['transactions']);

			// Set up event listeners
			const unsubReady = wsClient.on('ready', () => {
				state.set('connected');
			});

			const unsubError = wsClient.on('error', () => {
				state.set('error');
			});

			const unsubClose = wsClient.on('close', () => {
				state.set('disconnected');
			});

			const unsubTransaction = wsClient.on('transaction', (tx: TransactionWithMeta) => {
				lastTransaction.set(tx);
				
				const fromDisplay = tx.from || 'Mining reward';
				notifications.info(
					t('notifications.newTransaction', {
						from: fromDisplay,
						to: tx.to,
						amount: tx.value.toString()
					})
				);

				// Process transaction for push notifications
				try {
					processTransactionForNotification(tx);
				} catch (error) {
					console.error('Failed to process transaction for notification:', error);
				}
			});

			cleanupFns = [unsubReady, unsubError, unsubClose, unsubTransaction];

			// Initiate connection
			wsClient.connect().catch((e: unknown) => {
				console.error('WebSocket connection failed:', e);
				state.set('error');
			});
		} catch (e) {
			state.set('error');
			console.error('WebSocket connection failed:', e);
		}
	}

	/**
	 * Disconnect from the WebSocket server
	 */
	function disconnect(): void {
		// Clean up event listeners
		cleanupFns.forEach((fn) => fn());
		cleanupFns = [];

		wsClient = null;
		state.set('disconnected');
	}

	/**
	 * Get the current state synchronously
	 */
	function getState(): WebSocketState {
		return get(state);
	}

	// Derived store for external access
	const stateStore = derived(state, ($state) => $state);

	return {
		state: { subscribe: stateStore.subscribe },
		lastTransaction: { subscribe: lastTransaction.subscribe },
		connect,
		disconnect,
		getState
	};
}

export const websocket = createWebSocketStore();
