<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
	import { getValidationFailures } from '$lib/api/shopsync-reports';
	import type { ValidationFailureRecord, ValidationFailuresResponse } from '$lib/types/shopsync-reports';
	import { relativeTime } from '$lib/util';
	import { paramState } from '$lib/paramState.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { t$ } from '$lib/i18n';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		limit = 25
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		limit?: number;
	} = $props();

	let page = paramState('vf_page', 1, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => value >= 2
	});

	let loading: boolean = $state(true);
	let error: string | null = $state(null);
	let data: ValidationFailuresResponse | null = $state(null);

	let paginatedData = $derived.by(() => {
		if (!data || !data.ok) return [];
		return data.data.slice((page.value - 1) * limit, page.value * limit);
	});

	async function fetchData() {
		if (!browser) return;

		loading = true;
		error = null;

		const result = await getValidationFailures({ limit: 500 });

		if (result.ok) {
			data = result as ValidationFailuresResponse;
		} else {
			error = 'error' in result ? (result.message ?? result.error) : 'Failed to fetch validation failures';
		}

		loading = false;
	}

	onMount(() => {
		fetchData();
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faExclamationTriangle} /> {$t$('reports.validationFailures')}</h2>

	{#if error}
		<div class="error-message">
			<p>{error}</p>
			<button onclick={fetchData}>{$t$('common.retry')}</button>
		</div>
	{:else if loading}
		<ModuleLoading>
			<SkeletonTable rows={5} columns={4} />
		</ModuleLoading>
	{:else if data && data.data.length > 0}
		<Pagination bind:page={page.value} total={data.count} {limit} />

		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>{$t$('shop.shop')}</th>
						<th>{$t$('reports.computerId')}</th>
						<th>{$t$('reports.errors')}</th>
						<th class="right">{$t$('transaction.time')}</th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedData as record (record.id)}
						{@const timestamp = new Date(record.timestamp)}
						<tr>
							<td>{record.shopName ?? $t$('common.unknown')}</td>
							<td>{record.computerId ?? '—'}</td>
							<td class="errors-cell">
								<ul class="error-list">
									{#each record.errors as err (err)}
										<li>{err}</li>
									{/each}
								</ul>
							</td>
							<td class="right time" title={timestamp.toLocaleString()}>
								{relativeTime(timestamp)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<Pagination bind:page={page.value} total={data.count} {limit} />
	{:else}
		<p class="no-data">{$t$('reports.noValidationFailures')}</p>
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

	.errors-cell {
		max-width: 400px;
	}

	.error-list {
		margin: 0;
		padding-left: 1.2em;
		font-size: 0.85em;
		color: rgb(var(--red));
	}

	.error-list li {
		margin: 0.2em 0;
	}

	.time {
		font-size: 0.9rem;
		white-space: nowrap;
	}
</style>
