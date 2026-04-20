<script lang="ts">
	import Modal from '../ui/Modal.svelte';
	import { getKrawletClient } from '$lib/api/krawlet';
	import { confirm } from '$lib/stores/confirm';

	type Props = {
		open: boolean;
		transferId: string;
		pollIntervalMs?: number | null;
	};

	let { open = $bindable(false), transferId, pollIntervalMs = 500 }: Props = $props();

	const client = getKrawletClient();

	type Transfer = {
		status: string;
		itemName: string;
		quantityTransferred?: number;
		quantity?: number;
		error?: string | null;
	};

	let transfer = $state<Transfer | null>(null);
	let loading = $state(false);
	let errorMessage: string | null = $state(null);

	const quantityTransferred = $derived(transfer?.quantityTransferred ?? 0);
	const quantityRequested = $derived(transfer?.quantity ?? 0);

	const progressPercent = $derived.by(() => {
		if (quantityRequested > 0) {
			const p = (quantityTransferred / quantityRequested) * 100;
			return Math.max(0, Math.min(100, p));
		}

		return transfer?.status === 'completed' ? 100 : 0;
	});

	const statusLabel = $derived(transfer ? transfer.status.replaceAll('_', ' ') : 'loading');
	const statusClass = $derived.by(() => {
		if (transfer?.status === 'completed') return 'completed';
		if (transfer?.status === 'failed') return 'failed';
		return 'active';
	});

	const pollingEnabled = $derived(typeof pollIntervalMs === 'number' && pollIntervalMs > 0);

	const isFinished = $derived(transfer?.status === 'completed' || transfer?.status === 'failed');

	function handleClose() {
		if (isFinished || !transfer) {
			open = false;
			return;
		}

		confirm.confirm({
			message: 'Transfer is still in progress. Are you sure you want to close?',
			confirmButtonLabel: 'Close anyway',
			cancelButtonLabel: 'Keep open',
			confirm: () => {
				open = false;
			}
		});
	}

	$effect(() => {
		if (!open || !transferId) {
			transfer = null;
			errorMessage = null;
			loading = false;
			return;
		}

		let disposed = false;
		let inFlight = false;

		const fetchTransfer = async () => {
			if (disposed || inFlight) return;
			inFlight = true;

			try {
				const nextTransfer = await client.transfers.get(transferId);
				if (!disposed) {
					transfer = nextTransfer as Transfer;
					errorMessage = null;
				}
			} catch (error) {
				if (!disposed) {
					errorMessage = error instanceof Error ? error.message : 'Unknown error';
				}
			} finally {
				if (!disposed) {
					loading = false;
				}
				inFlight = false;
			}
		};

		loading = true;
		void fetchTransfer();

		const intervalMs =
			typeof pollIntervalMs === 'number' && pollIntervalMs > 0 ? pollIntervalMs : null;
		const interval = intervalMs !== null ? setInterval(fetchTransfer, intervalMs) : null;

		return () => {
			disposed = true;
			if (interval) {
				clearInterval(interval);
			}
		};
	});
</script>

<Modal {open} title="Transfer Progress" onClose={handleClose}>
	{#if loading && !transfer && !errorMessage}
		<p class="muted">Loading transfer details...</p>
	{:else if errorMessage && !transfer}
		<p class="error">Error loading transfer details: {errorMessage}</p>
	{:else if transfer}
		<section class="progress-card">
			<div class="header-row">
				<p class="status {statusClass}">{statusLabel}</p>
				<p class="percent">{progressPercent.toFixed(0)}%</p>
			</div>

			<div
				class="bar"
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={progressPercent}
			>
				<div class="fill {statusClass}" style="width: {progressPercent.toFixed(2)}%;"></div>
			</div>

			<div class="stats">
				<p><span class="label">Item</span> <span class="value">{transfer.itemName}</span></p>
				<p>
					<span class="label">Moved</span>
					<span class="value"
						>{quantityTransferred.toLocaleString()} / {quantityRequested.toLocaleString()}</span
					>
				</p>
				{#if transfer.error}
					<p class="error">
						<span class="label">Error</span> <span class="value">{transfer.error}</span>
					</p>
				{/if}
			</div>

			{#if loading && pollingEnabled}
				<p class="muted">Refreshing every {pollIntervalMs} ms...</p>
			{/if}
		</section>
	{/if}
</Modal>

<style>
	.progress-card {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		padding: 0.8rem;
		background: linear-gradient(180deg, rgba(var(--blue), 0.08), rgba(var(--blue), 0.03));
		border: 1px solid rgba(var(--blue), 0.22);
		border-radius: 0.7rem;
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.75rem;
	}

	.status,
	.percent,
	.stats p,
	.muted,
	.error {
		margin: 0;
	}

	.status {
		text-transform: capitalize;
		font-weight: 700;
		letter-spacing: 0.02em;
	}

	.status.active {
		color: rgb(var(--blue));
	}

	.status.completed {
		color: rgb(var(--green));
	}

	.status.failed {
		color: rgb(var(--red));
	}

	.percent {
		font-variant-numeric: tabular-nums;
		color: var(--text-color-1);
		font-weight: 700;
	}

	.bar {
		height: 0.75rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.12);
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.fill {
		height: 100%;
		border-radius: inherit;
		transition: width 0.32s ease;
	}

	.fill.active {
		background: linear-gradient(90deg, rgba(var(--blue), 0.6), rgba(var(--blue), 1));
	}

	.fill.completed {
		background: linear-gradient(90deg, rgba(var(--green), 0.6), rgba(var(--green), 1));
	}

	.fill.failed {
		background: linear-gradient(90deg, rgba(var(--red), 0.6), rgba(var(--red), 1));
	}

	.stats {
		display: grid;
		gap: 0.45rem;
	}

	.stats p {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.label {
		color: var(--text-color-2);
	}

	.value {
		color: var(--text-color-1);
		text-align: right;
		overflow-wrap: anywhere;
	}

	.muted {
		color: var(--text-color-2);
		font-size: 0.9rem;
	}

	.error {
		color: rgb(var(--red));
	}

	@media only screen and (max-width: 768px) {
		.stats p {
			flex-direction: column;
			gap: 0.15rem;
		}

		.value {
			text-align: left;
		}
	}
</style>
