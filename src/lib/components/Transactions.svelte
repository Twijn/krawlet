<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faList } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import { relativeTime } from '$lib/util.js';
	import Pagination from '$lib/components/Pagination.svelte';
	import { browser } from '$app/environment';
	import Address from '$lib/components/Address.svelte';
	import kromer from '$lib/api/kromer';
	import type { TransactionsResponse } from 'kromer';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		address,
		limit = 100
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		address?: string;
		limit?: number;
	} = $props();

	let page: number = $state(1);
	let includeMined: boolean = $state(false);

	let loading: boolean = $state(false);

	let transactionsPromise = $derived(
		browser
			? address
				? kromer.addresses.getTransactions(address, {
						offset: (page - 1) * limit,
						limit
					})
				: kromer.transactions.getLatest({
						offset: (page - 1) * limit,
						limit,
						excludeMined: !includeMined
					})
			: null
	);

	let transactions: TransactionsResponse | null = $state(null);

	$effect(() => {
		loading = true;
		if (transactionsPromise) {
			transactionsPromise.then((result) => {
				transactions = result;
				loading = false;
			});
		}
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faList} /> Recent Transactions</h2>
	{#if transactions}
		{#if transactions.transactions.length === 0}
			<small class="none-found">
				No transactions found{address ? ` for address ${address}` : ''}!
			</small>
		{:else}
			{#if !address}
				<label class="center">
					<input type="checkbox" bind:checked={includeMined} />
					Include welfare transactions
				</label>
			{/if}
			{#if limit > 25}
				<Pagination bind:page total={transactions.total} {limit} />
			{:else if address}
				<a id="view-all" href="/addresses/{address}/transactions"
					>View all transactions for {address}</a
				>
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
								<td class="center"><a href="/transactions/{transaction.id}">{transaction.id}</a></td
								>
								<td class="caps"
									>{transaction.type === 'mined'
										? 'welfare'
										: transaction.type.replace(/_/g, ' ')}</td
								>
								<td>
									{#if transaction.from}
										<Address address={transaction.from} />
									{/if}
								</td>
								<td>
									<Address address={transaction.to} />
								</td>
								<td class="right">{transaction.value.toFixed(2)} <small>KRO</small></td>
								<td class="metadata"
									><span>{transaction?.metadata ? transaction.metadata.substring(0, 100) : ''}</span
									></td
								>
								<td title={transaction.time.toLocaleString()}>{relativeTime(transaction.time)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<Pagination bind:page total={transactions.total} {limit} />
		{/if}
	{:else}
		<ModuleLoading />
	{/if}
</Section>

<style>
	#view-all {
		display: block;
		text-align: center;
		font-size: 0.8em;
		color: var(--text-color-2);
		margin: 1em 0;
	}

	.metadata {
		max-width: 10em;
	}

	.metadata span {
		display: block;
		max-width: 100%;
		overflow: hidden;
	}

	.none-found {
		display: block;
		color: rgb(var(--red));
		text-align: center;
	}
</style>
