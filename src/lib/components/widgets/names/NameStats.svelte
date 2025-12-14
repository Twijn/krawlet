<script lang="ts">
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import type { NamesResponse } from 'kromer';
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
	let totalNames: number = $state(0);
	let recentRegistrations: number = $state(0);
	let recentTransfers: number = $state(0);

	$effect(() => {
		if (browser) {
			loading = true;

			// Get total count and recent names
			kromer.names
				.getAll({ limit: 100 })
				.then((result: NamesResponse) => {
					totalNames = result.total;

					const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

					recentRegistrations = result.names.filter(
						(name) => name.registered && new Date(name.registered) > oneWeekAgo
					).length;

					recentTransfers = result.names.filter(
						(name) => name.transferred && new Date(name.transferred) > oneWeekAgo
					).length;

					loading = false;
				})
				.catch(console.error);
		}
	});
</script>

<div
	class="col-{lgCols} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''} statistics"
>
	<div class="statistic">
		<h2>{$t$('stats.totalNames')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{totalNames.toLocaleString()}
			{/if}
		</div>
	</div>
	<div class="statistic">
		<h2>{$t$('stats.recentRegistrations')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{recentRegistrations} <small>{$t$('stats.thisWeek')}</small>
			{/if}
		</div>
	</div>
	<div class="statistic">
		<h2>{$t$('stats.recentNameTransfers')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{recentTransfers} <small>{$t$('stats.thisWeek')}</small>
			{/if}
		</div>
	</div>
</div>

<style>
	.loading {
		opacity: 0.5;
	}
</style>
