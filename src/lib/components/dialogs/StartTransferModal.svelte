<script lang="ts">
	import type { TransferTarget } from 'krawlet-js';
	import Modal from '../ui/Modal.svelte';
	import { getKrawletClient } from '$lib/api/krawlet';
	import { notifications } from '$lib/stores/notifications';

	type Props = {
		open: boolean;
		initialItemName?: string;
		initialItemNbt?: string;
		initialQuantity?: number;
		initialTimeout?: number | null;
		onTransferCreated?: (transferId: string) => void;
	};

	let {
		open = $bindable(false),
		initialItemName = '',
		initialItemNbt = '',
		initialQuantity = 1,
		initialTimeout = null,
		onTransferCreated
	}: Props = $props();

	const client = getKrawletClient();

	let targets = $state<TransferTarget[]>([]);
	let loadingTargets = $state(false);
	let targetsError = $state<string | null>(null);

	let selectedTargetId = $state('');
	let itemName = $state(initialItemName);
	let itemNbt = $state(initialItemNbt);
	let quantity = $state(Math.max(1, initialQuantity));
	let timeout = $state<number | null>(initialTimeout);

	const selectedTarget = $derived(targets.find((target) => target.id === selectedTargetId) ?? null);
	const canSubmit = $derived(
		selectedTargetId.length > 0 && itemName.trim().length > 0 && quantity > 0 && !loadingTargets
	);

	function resetForm() {
		itemName = initialItemName;
		itemNbt = initialItemNbt;
		quantity = Math.max(1, initialQuantity);
		timeout = initialTimeout;
	}

	function normalizeTimeout(value: number | null): number | undefined {
		return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
	}

	async function loadTargets() {
		loadingTargets = true;
		targetsError = null;

		try {
			const nextTargets = await client.transfers.getTargets();
			targets = nextTargets;
			if (!selectedTargetId || !nextTargets.some((target) => target.id === selectedTargetId)) {
				selectedTargetId = nextTargets[0]?.id ?? '';
			}
		} catch (error) {
			targets = [];
			selectedTargetId = '';
			targetsError = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			loadingTargets = false;
		}
	}

	async function onSubmit() {
		if (!canSubmit) {
			notifications.error('Please choose a target and item before starting a transfer.');
			return;
		}

		try {
			const transfer = await client.transfers.create({
				to: selectedTargetId,
				itemName: itemName.trim(),
				itemNbt: itemNbt.trim() || undefined,
				quantity,
				timeout: normalizeTimeout(timeout)
			});

			onTransferCreated?.(transfer.id);
			notifications.success('Transfer started successfully!');
			open = false;
		} catch (error) {
			console.error('Error starting transfer:', error);
			notifications.error(error instanceof Error ? error.message : 'Failed to start transfer.');
		}
	}

	$effect(() => {
		if (!open) return;
		resetForm();
		void loadTargets();
	});
</script>

<Modal
	{open}
	title="Start Transfer"
	onClose={() => (open = false)}
	{onSubmit}
	confirmButtonOverrides={{
		children: undefined,
		variant: 'primary'
	}}
>
	{#if loadingTargets}
		<p class="muted">Loading transfer targets...</p>
	{:else}
		<label>
			Target
			<select bind:value={selectedTargetId} disabled={targets.length === 0} required>
				{#if targets.length === 0}
					<option value="">No targets available</option>
				{:else}
					{#each targets as target (target.id)}
						<option value={target.id}>{target.name} ({target.type})</option>
					{/each}
				{/if}
			</select>
		</label>

		{#if selectedTarget}
			<div class="target-card">
				<div class="target-header">
					<strong>{selectedTarget.name}</strong>
					<small>{selectedTarget.type}</small>
				</div>
				{#if selectedTarget.links.length > 0}
					<div class="target-links">
						{#each selectedTarget.links as link, index (index)}
							<span class="target-link">{link.type}: {link.value}</span>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<label>
			Item Name
			<input type="text" bind:value={itemName} placeholder="minecraft:diamond" required />
		</label>

		<label>
			Item NBT
			<input type="text" bind:value={itemNbt} placeholder="Optional" />
			<small>Leave blank for normal items.</small>
		</label>

		<div class="field-row">
			<label>
				Quantity
				<input type="number" min="1" step="1" bind:value={quantity} required />
			</label>

			<label>
				Timeout
				<input type="number" min="1" step="1" bind:value={timeout} placeholder="Optional" />
			</label>
		</div>

		{#if targetsError}
			<p class="error">Error loading targets: {targetsError}</p>
		{:else if targets.length === 0}
			<p class="muted">No transfer targets are currently available.</p>
		{/if}
	{/if}
</Modal>

<style>
	.muted,
	.error {
		margin: 0;
	}

	.muted {
		color: var(--text-color-2);
	}

	.error {
		color: rgb(var(--red));
	}

	.field-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.target-card {
		padding: 0.85rem;
		border-radius: 0.65rem;
		border: 1px solid rgba(var(--theme-color-rgb), 0.22);
		background: linear-gradient(
			180deg,
			rgba(var(--theme-color-rgb), 0.12),
			rgba(var(--theme-color-rgb), 0.05)
		);
	}

	.target-header {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: baseline;
	}

	.target-header strong {
		color: var(--text-color-1);
	}

	.target-header small {
		color: var(--text-color-2);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.target-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.65rem;
	}

	.target-link {
		display: inline-flex;
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-color-1);
		font-size: 0.8rem;
	}

	@media only screen and (max-width: 768px) {
		.field-row {
			grid-template-columns: 1fr;
		}

		.target-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
