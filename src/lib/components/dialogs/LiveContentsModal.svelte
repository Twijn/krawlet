<script lang="ts">
	import type { StorageSlotContents, StorageSlotItem } from 'krawlet-js';
	import Modal from '../ui/Modal.svelte';
	import Button from '../ui/Button.svelte';
	import { getKrawletClient } from '$lib/api/krawlet';
	import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	type Props = {
		open: boolean;
	};

	let { open = $bindable(false) }: Props = $props();

	const client = getKrawletClient();

	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let contents = $state<StorageSlotContents | null>(null);

	const items = $derived.by(() => {
		const rawItems = contents?.items;
		return (Array.isArray(rawItems) ? rawItems : []).slice().sort((a, b) => a.name.localeCompare(b.name));
	});

	async function loadContents() {
		loading = true;
		errorMessage = null;

		try {
			contents = await client.transfers.getContents();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!open) return;
		void loadContents();
	});

	function getImageUrl(item: StorageSlotItem): string {
		return `https://cdn.krawlet.cc/${item.name.replace(':', '/')}.png`;
	}
</script>

<Modal {open} title="Live Contents" onClose={() => (open = false)}>
	<div class="header-actions">
		<Button variant="secondary" size="small" onClick={loadContents} disabled={loading}>
			<FontAwesomeIcon icon={faRotateRight} />
			Refresh
		</Button>
	</div>

	{#if errorMessage}
		<p class="error">Error loading contents: {errorMessage}</p>
	{:else if loading && !contents}
		<p class="muted">Loading current contents...</p>
	{:else if items.length === 0}
		<p class="muted">No contents currently available.</p>
	{:else}
		<ul class="contents-list">
			{#each items as item, index (item.name + ':' + (item.nbt ?? '') + ':' + index)}
				<li class="content-item">
					<img src={getImageUrl(item)} alt={item.name} class="item-image" loading="lazy" />
					<div class="item-details">
						<strong>{item.name}</strong>
						{#if item.nbt}
							<small class="nbt">NBT: {item.nbt}</small>
						{/if}
					</div>
					<div class="item-count">x{item.count.toLocaleString()}</div>
				</li>
			{/each}
		</ul>
		{#if loading}
			<p class="muted">Refreshing contents...</p>
		{/if}
	{/if}
</Modal>

<style>
	.header-actions {
		display: flex;
		justify-content: flex-end;
	}

	.contents-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.65rem;
	}

	.content-item {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.75rem;
		border-radius: 0.65rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.item-image {
		width: 2.25rem;
		height: 2.25rem;
		padding: 0.2rem;
		border-radius: 0.4rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.item-details {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.item-details strong {
		color: var(--text-color-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-details small {
		color: var(--text-color-2);
		overflow-wrap: anywhere;
	}

	.nbt {
		font-family: monospace;
	}

	.item-count {
		color: var(--text-color-1);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

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

	@media only screen and (max-width: 768px) {
		.content-item {
			grid-template-columns: auto minmax(0, 1fr);
		}

		.item-count {
			grid-column: 2;
		}
	}
</style>
