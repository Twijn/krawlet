<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faList } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { formatCurrency, relativeTime } from '$lib/util.js';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { browser } from '$app/environment';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import kromer from '$lib/api/kromer';
	import type { TransactionsResponse } from 'kromer';
	import { paramState } from '$lib/paramState.svelte.js';
	import ParsedMetadata from '$lib/components/widgets/transactions/ParsedMetadata.svelte';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import settings from '$lib/stores/settings';
	import { SEVEN_DAYS } from '$lib/consts';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		address,
		limit = 100,
		queryPrefix = ''
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		address?: string;
		limit?: number;
		queryPrefix?: string;
	} = $props();

	let page = paramState(`${queryPrefix}page`, 1, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => value >= 2
	});

	let includeMined = paramState(`${queryPrefix}incl_mined`, false, {
		serialize: (value) => value.toString(),
		deserialize: (value) => value === 'true',
		shouldSet: (value) => value
	});

	let loading: boolean = $state(false);

	let transactionsPromise = $derived(
		browser
			? address
				? kromer.addresses.getTransactions(address, {
						offset: (page.value - 1) * limit,
						limit
					})
				: kromer.transactions.getLatest({
						offset: (page.value - 1) * limit,
						limit,
						excludeMined: !includeMined.value
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
				<ToggleCheckbox bind:checked={includeMined.value} center>
					Include Welfare Transactions
				</ToggleCheckbox>
			{/if}
			{#if limit > 25}
				<Pagination bind:page={page.value} total={transactions.total} {limit} />
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
							{#if $settings.showMetadata}
								<th>{$settings.parseTransactionMessage ? "Message" : "Metadata"}</th>
							{/if}
							<th class="right">Time</th>
						</tr>
					</thead>
					<tbody>
						{#each transactions.transactions as transaction (transaction.id)}
							{@const meta = kromer.transactions.parseMetadata(transaction)}
							{@const showRelative = $settings.relativeTimeEnabled && ($settings.relativeTimeAbove7d || Date.now() - transaction.time.getTime() <= SEVEN_DAYS)}
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
								<td class="right">{formatCurrency(transaction.value)} <small>KRO</small></td>
								{#if $settings.showMetadata}
									<td class="metadata">
										{#if $settings.parseTransactionMessage}
											<ParsedMetadata {meta} limitWidth={true} />
										{:else if transaction.metadata && transaction.metadata.length > 0}
											<small>{transaction.metadata.substring(0, 75)}</small>
										{:else}
											<small>[No metadata]</small>
										{/if}
									</td>
								{/if}
								<td class="time right" title={showRelative ? transaction.time.toLocaleString() : undefined}>
									{#if showRelative}
										{relativeTime(transaction.time)}
									{:else}
										{transaction.time.toLocaleString()}
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<Pagination bind:page={page.value} total={transactions.total} {limit} />
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

	.none-found {
		display: block;
		color: rgb(var(--red));
		text-align: center;
	}

	.time {
			font-size: .9rem;
	}
</style>
