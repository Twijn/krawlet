<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
	import { getSuccessfulPosts } from '$lib/api/shopsync-reports';
	import type { SuccessfulPostsResponse } from '$lib/types/shopsync-reports';
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

	let page = paramState('sp_page', 1, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => value >= 2
	});

	let loading: boolean = $state(true);
	let error: string | null = $state(null);
	let data: SuccessfulPostsResponse | null = $state(null);

	let paginatedData = $derived.by(() => {
		if (!data || !data.ok) return [];
		return data.data.slice((page.value - 1) * limit, page.value * limit);
	});

	async function fetchData() {
		if (!browser) return;

		loading = true;
		error = null;

		const result = await getSuccessfulPosts({ limit: 500 });

		if (result.ok) {
			data = result as SuccessfulPostsResponse;
		} else {
			error =
				'error' in result ? (result.message ?? result.error) : 'Failed to fetch successful posts';
		}

		loading = false;
	}

	onMount(() => {
		fetchData();
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faCheckCircle} /> {$t$('reports.successfulPosts')}</h2>

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
						<th>{$t$('reports.shopId')}</th>
						<th class="center">{$t$('reports.itemCount')}</th>
						<th class="right">{$t$('transaction.time')}</th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedData as record (record.id)}
						{@const timestamp = new Date(record.timestamp)}
						<tr>
							<td>
								<a href="/shops/{record.shopId}">{record.shopName}</a>
							</td>
							<td class="shop-id">{record.shopId}</td>
							<td class="center">{record.itemCount.toLocaleString()}</td>
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
		<p class="no-data">{$t$('reports.noSuccessfulPosts')}</p>
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

	.shop-id {
		font-family: var(--font-mono, monospace);
		font-size: 0.85em;
		color: var(--text-color-2);
	}

	.time {
		font-size: 0.9rem;
		white-space: nowrap;
	}
</style>
