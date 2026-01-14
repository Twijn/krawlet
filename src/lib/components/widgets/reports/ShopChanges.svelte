<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faStore, faPlus, faExchange } from '@fortawesome/free-solid-svg-icons';
	import { getShopChanges } from '$lib/api/shopsync-reports';
	import type { ShopChangesResponse } from '$lib/types/shopsync-reports';
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

	let page = paramState('sc_page', 1, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => value >= 2
	});

	let loading: boolean = $state(true);
	let error: string | null = $state(null);
	let data: ShopChangesResponse | null = $state(null);

	let totalCount = $derived.by(() => {
		if (!data || !data.ok) return 0;
		return data.recentCount + data.historyCount;
	});
	let allRecords = $derived.by(() => {
		if (!data || !data.ok) return [];
		return [...data.recent];
	});
	let paginatedRecords = $derived(allRecords.slice((page.value - 1) * limit, page.value * limit));

	async function fetchData() {
		if (!browser) return;

		loading = true;
		error = null;

		const result = await getShopChanges({ limit: 500, source: 'memory' });

		if (result.ok) {
			data = result as ShopChangesResponse;
		} else {
			error = 'error' in result ? (result.message ?? result.error) : 'Failed to fetch shop changes';
		}

		loading = false;
	}

	onMount(() => {
		fetchData();
	});

	function formatChangeValue(value: unknown, compareValue?: unknown): string {
		if (value === null || value === undefined) return '—';
		if (typeof value === 'boolean') return value ? 'Yes' : 'No';
		if (typeof value === 'number') return value.toLocaleString();

		// Handle price arrays
		if (
			Array.isArray(value) &&
			value.length > 0 &&
			value[0]?.value !== undefined &&
			value[0]?.currency !== undefined
		) {
			const compareArray = Array.isArray(compareValue) ? compareValue : null;
			return value
				.map(
					(
						price: { value: number | string; currency: string; address?: string },
						index: number
					) => {
						const val =
							typeof price.value === 'number' ? price.value.toLocaleString() : price.value;
						const comparePriceAddress = compareArray?.[index]?.address;
						// Only show address when comparing and the address has actually changed (not undefined vs defined)
						const showAddress =
							price.address &&
							compareArray &&
							comparePriceAddress !== undefined &&
							comparePriceAddress !== price.address;
						return showAddress
							? `${val} ${price.currency} @ ${price.address}`
							: `${val} ${price.currency}`;
					}
				)
				.join(', ');
		}

		if (typeof value === 'object') return JSON.stringify(value);
		return String(value);
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faStore} /> {$t$('reports.shopChanges')}</h2>

	{#if error}
		<div class="error-message">
			<p>{error}</p>
			<button onclick={fetchData}>{$t$('common.retry')}</button>
		</div>
	{:else if loading}
		<ModuleLoading>
			<SkeletonTable rows={5} columns={4} />
		</ModuleLoading>
	{:else if data && allRecords.length > 0}
		<Pagination bind:page={page.value} total={totalCount} {limit} />

		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>{$t$('reports.changeType')}</th>
						<th>{$t$('shop.shop')}</th>
						<th>{$t$('reports.changes')}</th>
						<th class="right">{$t$('transaction.time')}</th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedRecords as record (record.id)}
						{@const timestamp = new Date(record.timestamp)}
						<tr>
							<td>
								{#if record.isNewShop}
									<span class="change-badge new-shop">
										<FontAwesomeIcon icon={faPlus} />
										{$t$('reports.newShop')}
									</span>
								{:else}
									<span class="change-badge updated">
										<FontAwesomeIcon icon={faExchange} />
										{$t$('reports.updated')}
									</span>
								{/if}
							</td>
							<td>
								<a href="/shops/{record.shopId}">{record.shopName}</a>
							</td>
							<td class="changes-cell">
								<div class="changes-list">
									{#each record.changes as change (change.field)}
										<div class="field-change">
											<span class="field-name">{change.field}:</span>
											<span class="field-prev"
												>{formatChangeValue(change.previousValue, change.newValue)}</span
											>
											<span class="arrow">→</span>
											<span class="field-new"
												>{formatChangeValue(change.newValue, change.previousValue)}</span
											>
										</div>
									{/each}
								</div>
							</td>
							<td class="right time" title={timestamp.toLocaleString()}>
								{relativeTime(timestamp)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<Pagination bind:page={page.value} total={totalCount} {limit} />
	{:else}
		<p class="no-data">{$t$('reports.noShopChanges')}</p>
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

	.change-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.25em 0.6em;
		border-radius: 0.25em;
		font-size: 0.85em;
		font-weight: 500;
	}

	.change-badge.new-shop {
		background-color: rgba(var(--green), 0.2);
		color: rgb(var(--green));
	}

	.change-badge.updated {
		background-color: rgba(var(--yellow), 0.2);
		color: rgb(var(--yellow));
	}

	.changes-cell {
		max-width: 350px;
	}

	.changes-list {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	.field-change {
		display: flex;
		align-items: center;
		gap: 0.4em;
		font-size: 0.9em;
		flex-wrap: wrap;
	}

	.field-name {
		font-weight: 500;
		color: var(--text-color-2);
	}

	.field-prev {
		color: var(--text-color-2);
		text-decoration: line-through;
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.arrow {
		color: var(--text-color-2);
	}

	.field-new {
		font-weight: 500;
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.time {
		font-size: 0.9rem;
		white-space: nowrap;
	}
</style>
