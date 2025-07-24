<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faList } from '@fortawesome/free-solid-svg-icons';
	import type { TransactionsResponse } from '$lib/api/types/Transaction';
	import kromer from '$lib/api/kromer';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import { relativeTime } from '$lib/util.js';
	import Pagination from '$lib/components/Pagination.svelte';
	import { browser } from '$app/environment';

	type ColumnCount = 1|2|3|4|5|6|7|8|9|10|11|12|null;

	const { lgCols = null, mdCols = null, smCols = null, limit = 100 }: {
		lgCols?: ColumnCount,
		mdCols?: ColumnCount,
		smCols?: ColumnCount,
		limit?: number;
	} = $props();

	let page: number = $state(1);
	let includeMined: boolean = $state(false);

	let loading: boolean = $state(false);

	let transactionsPromise = $derived(browser ? kromer.allTransactions({
		latest: true,
		offset: (page - 1) * limit,
		limit,
		excludeMined: !includeMined,
	}) : null);

	let transactions: TransactionsResponse|null = $state(null);

	$effect(() => {
		loading = true;
		if (transactionsPromise) {
			transactionsPromise.then(result => {
				transactions = result;
				loading = false;
			});
		}
	});
</script>

<Section lgCols={lgCols} mdCols={mdCols} smCols={smCols}>
	<h2><FontAwesomeIcon icon={faList} /> Recent Transactions</h2>
	{#if transactions}
		{#if limit > 25}
			<Pagination bind:page={page} total={transactions.total} limit={limit} />
		{:else}
			<a id="view-all" href="/transactions">View all transactions</a>
		{/if}
		<div class="table-container">
			<ModuleLoading absolute={true} bind:loading />
			<table>
				<thead>
				<tr>
					<th class="center">ID</th>
					<th>Type</th>
					<th>From</th>
					<th>To</th>
					<th class="right">Value</th>
					<th>Metadata</th>
					<th>Time</th>
				</tr>
				</thead>
				<tbody>
				{#each transactions.transactions as transaction (transaction.id)}
					<tr>
						<td class="center">{transaction.id}</td>
						<td class="caps">{transaction.type.replace(/_/g, " ")}</td>
						<td>
							{#if transaction.from}
								<a href="/address/{transaction.from}">
									{transaction.from}
								</a>
							{/if}
						</td>
						<td>
							{#if transaction.to}
								<a href="/address/{transaction.to}">
									{transaction.to}
								</a>
							{/if}
						</td>
						<td class="right">{transaction.value.toFixed(2)} <small>KRO</small></td>
						<td class="metadata"><span>{transaction?.metadata ? transaction.metadata.substring(0, 100) : ''}</span></td>
						<td title={transaction.time.toLocaleString()}>{relativeTime(transaction.time)}</td>
					</tr>
				{/each}
				</tbody>
			</table>
		</div>
		<Pagination bind:page={page} total={transactions.total} limit={limit} />
	{:else}
		<ModuleLoading />
	{/if}
</Section>

<style>
	#view-all {
			display: block;
			text-align: center;
			font-size: .8em;
			color: var(--text-color-2);
			margin: 1em 0;
	}

	.table-container {
			/* position relative required for absolute ModuleLoading */
			position: relative;
			width: 100%;
      overflow-x: auto;
  }

	table {
			width: 100%;
			border-collapse: collapse;
      white-space: nowrap;
	}

	thead tr {
			background-color: rgba(0,0,0,0.1);
			border-bottom: .1em solid var(--theme-color-1);
	}

	tbody tr {
			border-bottom: .1em solid rgba(255,255,255,0.1);
	}

	tbody tr:last-child {
			border-bottom: none;
	}

	th, td {
			padding: .8rem .6rem;
			text-align: left;
	}

	.center {
			text-align: center;
	}

	.right {
			text-align: right;
	}

	.caps {
			text-transform: capitalize;
	}

	.metadata {
			max-width: 10em;
	}

	.metadata span {
			display: block;
			max-width: 100%;
      overflow: hidden;
	}
</style>
