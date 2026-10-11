<script lang="ts">
	import { getKrawletClient } from '$lib/api/krawlet';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import EnderStorageCard from '$lib/components/widgets/estorage/EnderStorageCard.svelte';
	import type { StorageData } from 'krawlet-js';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBoxArchive, faCube, faRotateRight } from '@fortawesome/free-solid-svg-icons';

	const krawlet = getKrawletClient();

	let loading = $state(true);
	let error: string | null = $state(null);
	let estorageData = $state<StorageData | null>(null);

	async function fetchData() {
		loading = true;
		error = null;
		try {
			estorageData = await krawlet.storage.get();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load ender storages';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		fetchData();
	});
</script>

<svelte:head>
	<title>Ender Storages | Krawlet</title>
</svelte:head>

<Breadcrumbs navItems={[{ label: 'Ender Storages', href: '/estorage' }]} />

<Section lgCols={12}>
	<h2><FontAwesomeIcon icon={faBoxArchive} /> Ender Storages</h2>

	{#if error}
		<div class="error-state">
			<p>{error}</p>
			<button onclick={fetchData}>
				<FontAwesomeIcon icon={faRotateRight} /> Retry
			</button>
		</div>
	{:else if loading}
		<div class="chest-grid">
			{#each [0, 1, 2, 3, 4, 5] as i (i)}
				<Skeleton variant="rectangular" width="100%" height="180px" />
			{/each}
		</div>
	{:else if estorageData?.data && estorageData.data.length > 0}
		<div class="chest-grid">
			{#each estorageData.data as chest, i (i)}
				<EnderStorageCard {chest} />
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<FontAwesomeIcon icon={faCube} />
			<p>No ender storages found.</p>
		</div>
	{/if}
</Section>

<style>
	.chest-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media only screen and (min-width: 640px) {
		.chest-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media only screen and (min-width: 1200px) {
		.chest-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.error-state {
		text-align: center;
		padding: 2.5em 2em;
		background-color: rgba(var(--red), 0.08);
		border-radius: 0.5rem;
		border: 1px solid rgba(var(--red), 0.2);
	}

	.error-state p {
		color: rgb(var(--red));
		font-weight: 500;
		margin-bottom: 1em;
	}

	.error-state button {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.5em 1.25em;
		background-color: var(--theme-color-1);
		color: white;
		border: none;
		border-radius: 0.35em;
		font-family: var(--font-family);
		font-weight: 500;
		cursor: pointer;
	}

	.error-state button:hover {
		opacity: 0.9;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 3em 2em;
		color: var(--text-color-2);
		font-size: 0.9rem;
	}

	.empty-state :global(svg) {
		font-size: 2rem;
		opacity: 0.4;
	}

	.empty-state p {
		margin: 0;
	}
</style>
