<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faChartBar, faDatabase, faMemory } from '@fortawesome/free-solid-svg-icons';
	import { getStats } from '$lib/api/shopsync-reports';
	import type { ReporterStats, StatsResponse } from '$lib/types/shopsync-reports';
	import { relativeTime } from '$lib/util';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { t$ } from '$lib/i18n';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let loading: boolean = $state(true);
	let error: string | null = $state(null);
	let stats: ReporterStats | null = $state(null);

	async function fetchData() {
		if (!browser) return;

		loading = true;
		error = null;

		const result = await getStats();

		if (result.ok) {
			stats = (result as StatsResponse).data;
		} else {
			error = 'error' in result ? (result.message ?? result.error) : 'Failed to fetch stats';
		}

		loading = false;
	}

	onMount(() => {
		fetchData();
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faChartBar} /> {$t$('reports.statsTitle')}</h2>

	{#if error}
		<div class="error-message">
			<p>{error}</p>
			<button onclick={fetchData}>{$t$('common.retry')}</button>
		</div>
	{:else if loading}
		<ModuleLoading>
			<SkeletonTable rows={4} columns={2} />
		</ModuleLoading>
	{:else if stats}
		<div class="stats-grid">
			<!-- In-Memory Stats -->
			<div class="stats-section">
				<h3><FontAwesomeIcon icon={faMemory} /> {$t$('reports.inMemory')}</h3>
				<div class="stats-list">
					<div class="stat-row">
						<span class="stat-label">{$t$('reports.validationFailures')}</span>
						<span class="stat-value">{stats.validationFailures.toLocaleString()}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">{$t$('reports.successfulPosts')}</span>
						<span class="stat-value">{stats.successfulPosts.toLocaleString()}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">{$t$('reports.shopChanges')}</span>
						<span class="stat-value">{stats.shopChanges.toLocaleString()}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">{$t$('reports.itemChangesCount')}</span>
						<span class="stat-value">{stats.itemChanges.toLocaleString()}</span>
					</div>
					{#if stats.oldestRecord}
						<div class="stat-row">
							<span class="stat-label">{$t$('reports.oldestRecord')}</span>
							<span class="stat-value" title={new Date(stats.oldestRecord).toLocaleString()}>
								{relativeTime(new Date(stats.oldestRecord))}
							</span>
						</div>
					{/if}
					{#if stats.newestRecord}
						<div class="stat-row">
							<span class="stat-label">{$t$('reports.newestRecord')}</span>
							<span class="stat-value" title={new Date(stats.newestRecord).toLocaleString()}>
								{relativeTime(new Date(stats.newestRecord))}
							</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Persistent Stats -->
			<div class="stats-section">
				<h3><FontAwesomeIcon icon={faDatabase} /> {$t$('reports.persistent')}</h3>
				<div class="stats-list">
					<div class="stat-row">
						<span class="stat-label">{$t$('reports.shopChanges')}</span>
						<span class="stat-value">{stats.persistent.shopChanges.toLocaleString()}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">{$t$('reports.itemChangesCount')}</span>
						<span class="stat-value">{stats.persistent.itemChanges.toLocaleString()}</span>
					</div>
					<div class="stat-row">
						<span class="stat-label">{$t$('reports.priceChanges')}</span>
						<span class="stat-value">{stats.persistent.priceChanges.toLocaleString()}</span>
					</div>
					<div class="stat-row total">
						<span class="stat-label">{$t$('reports.totalRecords')}</span>
						<span class="stat-value">{stats.persistent.total.toLocaleString()}</span>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<p class="no-data">{$t$('common.noData')}</p>
	{/if}
</Section>

<style>
	.error-message {
		text-align: center;
		padding: 2em;
		color: rgb(var(--red));
	}

	.error-message button {
		margin-top: 1em;
		padding: 0.5em 1em;
		background-color: var(--theme-color-1);
		color: white;
		border: none;
		border-radius: 0.25em;
		cursor: pointer;
	}

	.no-data {
		text-align: center;
		color: var(--text-color-2);
		padding: 2em;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.stats-section {
		background-color: var(--background-color-1);
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.stats-section h3 {
		font-size: 1rem;
		font-weight: 500;
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stats-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0;
	}

	.stat-row.total {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		font-weight: 600;
	}

	.stat-label {
		color: var(--text-color-2);
	}

	.stat-value {
		font-weight: 500;
		font-family: var(--font-mono, monospace);
	}
</style>
