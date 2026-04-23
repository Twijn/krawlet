import { browser } from '$app/environment';
import { derived, get, writable } from 'svelte/store';
import type { Transfer, TransferCreateRequest, TransferTarget } from 'krawlet-js';

import { getKrawletClient, isValidApiKey } from '$lib/api/krawlet';
import { t } from '$lib/i18n';
import settings from '$lib/stores/settings';

import { notifications } from './notifications';
import type { WebSocketState } from './websocket';

type KrawletWebsocketClient = ReturnType<typeof getKrawletClient>['websockets'];

function sortTransfers(transfers: Transfer[]): Transfer[] {
	return transfers
		.slice()
		.sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
}

function formatTransferTarget(transfer: Transfer): string {
	return transfer.toUsername?.trim() || transfer.toUUID?.trim() || 'Unknown target';
}

function formatTransferItem(transfer: Transfer): string {
	const transferWithDisplayName = transfer as Transfer & { itemDisplayName?: string | null };
	return transferWithDisplayName.itemDisplayName?.trim() || transfer.itemName?.trim() || 'unknown item';
}

function formatTransferQuantity(transfer: Transfer): string {
	return (transfer.quantity ?? transfer.quantityTransferred ?? 0).toLocaleString();
}

function createKrawletWebsocketStore() {
	const state = writable<WebSocketState>('disconnected');
	const error = writable<string | null>(null);
	const transfers = writable<Transfer[]>([]);

	let wsClient: KrawletWebsocketClient | null = null;
	let unsubscribeTransferUpdates: (() => void) | null = null;
	let connectPromise: Promise<void> | null = null;
	let shouldBeConnected = false;
	let currentApiKey = browser ? get(settings).krawletApiKey.trim() : '';

	function teardownClient(): void {
		unsubscribeTransferUpdates?.();
		unsubscribeTransferUpdates = null;

		if (wsClient) {
			wsClient.close();
			wsClient = null;
		}

		connectPromise = null;
	}

	function setDisconnected(clearTransfers: boolean): void {
		teardownClient();
		state.set('disconnected');
		error.set(null);
		if (clearTransfers) {
			transfers.set([]);
		}
	}

	function notifyTransferUpdate(previousTransfer: Transfer | null, nextTransfer: Transfer): void {
		const item = formatTransferItem(nextTransfer);
		const quantity = formatTransferQuantity(nextTransfer);
		const target = formatTransferTarget(nextTransfer);

		if (!previousTransfer) {
			notifications.info(
				t('notifications.transferStarted', {
					quantity,
					item,
					target
				})
			);
			return;
		}

		if (previousTransfer.status === nextTransfer.status) {
			return;
		}

		if (nextTransfer.status === 'completed') {
			notifications.success(
				t('notifications.transferCompleted', {
					quantity,
					item,
					target
				})
			);
			return;
		}

		if (nextTransfer.status === 'failed') {
			const message = nextTransfer.error?.trim();
			notifications.error(
				message
					? t('notifications.transferFailedWithReason', {
						item,
						target,
						reason: message
					})
					: t('notifications.transferFailed', {
						item,
						target
					})
			);
			return;
		}

		if (nextTransfer.status === 'cancelled') {
			notifications.warning(
				t('notifications.transferCancelled', {
					item,
					target
				})
			);
		}
	}

	function mergeTransfer(nextTransfer: Transfer, notify: boolean): Transfer {
		let previousTransfer: Transfer | null = null;
		let mergedTransfer = nextTransfer;

		transfers.update((currentTransfers) => {
			const index = currentTransfers.findIndex((transfer) => transfer.id === nextTransfer.id);
			if (index === -1) {
				mergedTransfer = nextTransfer;
				return sortTransfers([nextTransfer, ...currentTransfers]);
			}

			previousTransfer = currentTransfers[index];
			mergedTransfer = {
				...currentTransfers[index],
				...nextTransfer
			};

			const nextTransfers = currentTransfers.slice();
			nextTransfers[index] = mergedTransfer;
			return sortTransfers(nextTransfers);
		});

		if (notify) {
			notifyTransferUpdate(previousTransfer, mergedTransfer);
		}

		return mergedTransfer;
	}

	async function connectInternal(): Promise<void> {
		if (!browser || connectPromise) {
			return connectPromise ?? Promise.resolve();
		}

		const apiKey = get(settings).krawletApiKey.trim();
		currentApiKey = apiKey;

		if (!isValidApiKey(apiKey)) {
			setDisconnected(true);
			return;
		}

		state.set('connecting');
		error.set(null);

		connectPromise = (async () => {
			const client = getKrawletClient().websockets;
			wsClient = client;
			unsubscribeTransferUpdates = client.onTransferUpdate((transfer) => {
				mergeTransfer(transfer, true);
			});

			try {
				await client.start();
				await client.authenticate(apiKey);

				if (!shouldBeConnected || currentApiKey !== apiKey) {
					client.close();
					return;
				}

				const initialTransfers = await client.listTransfers();
				transfers.set(sortTransfers(initialTransfers));
				state.set('connected');
				error.set(null);
			} catch (err) {
				console.error('Failed to connect to Krawlet transfer websocket:', err);
				transfers.set([]);
				error.set(err instanceof Error ? err.message : 'Failed to connect to Krawlet transfers');
				state.set('error');
				client.close();
			} finally {
				if (wsClient === client && !client.isConnected()) {
					unsubscribeTransferUpdates?.();
					unsubscribeTransferUpdates = null;
					wsClient = null;
				}

				connectPromise = null;
			}
		})();

		return connectPromise;
	}

	async function ensureConnected(): Promise<KrawletWebsocketClient> {
		if (!browser) {
			throw new Error('Krawlet transfers are only available in the browser.');
		}

		const apiKey = get(settings).krawletApiKey.trim();
		if (!isValidApiKey(apiKey)) {
			throw new Error('A valid Krawlet API key is required for transfers.');
		}

		shouldBeConnected = true;
		await connectInternal();

		if (!wsClient?.isConnected()) {
			throw new Error(get(error) ?? 'Krawlet real-time updates are unavailable.');
		}

		return wsClient;
	}

	function connect(): void {
		shouldBeConnected = true;
		void connectInternal();
	}

	function disconnect(): void {
		shouldBeConnected = false;
		setDisconnected(true);
	}

	async function listTargets(): Promise<TransferTarget[]> {
		const client = await ensureConnected();
		return client.listTargets();
	}

	async function createTransfer(payload: TransferCreateRequest): Promise<Transfer> {
		const client = await ensureConnected();
		const transfer = await client.createTransfer(payload);
		return mergeTransfer(transfer, false);
	}

	async function getTransfer(transferId: string): Promise<Transfer> {
		const existingTransfer = get(transfers).find((transfer) => transfer.id === transferId);
		if (existingTransfer) {
			return existingTransfer;
		}

		const client = await ensureConnected();
		const transfer = await client.getTransfer(transferId);
		return mergeTransfer(transfer, false);
	}

	async function cancelTransfer(transferId: string): Promise<Transfer> {
		const client = await ensureConnected();
		const transfer = await client.cancelTransfer(transferId);
		return mergeTransfer(transfer, true);
	}

	function getState(): WebSocketState {
		return get(state);
	}

	if (browser) {
		settings.subscribe(($settings) => {
			const nextApiKey = $settings.krawletApiKey.trim();
			if (nextApiKey === currentApiKey) {
				return;
			}

			currentApiKey = nextApiKey;

			if (!shouldBeConnected) {
				if (!isValidApiKey(nextApiKey)) {
					transfers.set([]);
				}
				return;
			}

			if (!isValidApiKey(nextApiKey)) {
				setDisconnected(true);
				return;
			}

			setDisconnected(true);
			shouldBeConnected = true;
			void connectInternal();
		});
	}

	return {
		state: { subscribe: derived(state, ($state) => $state).subscribe },
		error: { subscribe: derived(error, ($error) => $error).subscribe },
		transfers: { subscribe: derived(transfers, ($transfers) => $transfers).subscribe },
		connect,
		disconnect,
		getState,
		listTargets,
		createTransfer,
		getTransfer,
		cancelTransfer
	};
}

export const krawletWebsocket = createKrawletWebsocketStore();