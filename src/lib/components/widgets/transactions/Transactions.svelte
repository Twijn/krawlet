<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faList } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { relativeTime } from '$lib/util.js';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { browser } from '$app/environment';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import kromer from '$lib/api/kromer';
	import type { TransactionMetadata, TransactionMetadataEntry, TransactionsResponse } from 'kromer';
	import { paramState } from '$lib/paramState.svelte.js';

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

	function findMeta(meta: TransactionMetadata, name: string): TransactionMetadataEntry | undefined {
		return meta.entries.find((entry) => entry.name.toLowerCase() === name);
	}

	function findDisplayMeta(meta: TransactionMetadata): TransactionMetadataEntry | undefined {
		return (
			findMeta(meta, 'error') ??
			findMeta(meta, 'message') ??
			findMeta(meta, 'msg') ??
			meta.entries.find((e) => !e.value)
		);
	}
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
					<input type="checkbox" bind:checked={includeMined.value} />
					Include welfare transactions
				</label>
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
							<th>Message</th>
							<th>Time</th>
						</tr>
					</thead>
					<tbody>
						{#each transactions.transactions as transaction (transaction.id)}
							{@const meta = kromer.transactions.parseMetadata(transaction)}
							{@const displayMeta = findDisplayMeta(meta)}
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
								<td class="metadata">
									{#if meta.entries.find(x => ["winner", "loser", "payout"].includes(x.name.toLowerCase()))}
										{#if meta.entries.find(x => x.name.toLowerCase() === "winner")}
											<span class="comp comp-winner">
												{meta.entries.find(x => x.name.toLowerCase() === "winner")?.value}
											</span>
										{/if}
										{#if meta.entries.find(x => x.name.toLowerCase() === "loser")}
											<span class="comp comp-loser">
												{meta.entries.find(x => x.name.toLowerCase() === "loser")?.value}
											</span>
										{/if}
										{#if meta.entries.find(x => x.name.toLowerCase() === "payout")}
											{@const payout = Number(meta.entries.find(x => x.name.toLowerCase() === "payout")?.value)}
											{#if !isNaN(payout) && payout > 0}
												<span class="comp comp-payout">
													{payout.toFixed(2)} <small>KRO</small>
												</span>
											{/if}
										{/if}
									{:else if displayMeta}
										<span
											class:error={displayMeta.name.toLowerCase() === 'error'}
											class:message={['message', 'msg'].includes(displayMeta.name.toLowerCase())}
										>
											{displayMeta.value ? displayMeta.value : displayMeta.name}
										</span>
									{:else}
										<small>[No message]</small>
									{/if}
								</td>
								<td title={transaction.time.toLocaleString()}>{relativeTime(transaction.time)}</td>
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

	.metadata {
		max-width: 16em;
	}

	.metadata span {
		display: block;
		max-width: 100%;
		overflow: hidden;
	}

	.metadata span.error {
		color: rgb(var(--red));
	}

	.metadata span.message {
		color: rgb(var(--blue));
	}

	.metadata span.comp-winner {
			--title: "Winner";
			--color: var(--green);
	}

	.metadata span.comp-loser {
			--title: "Loser";
			--color: var(--red);
	}

	.metadata span.comp-payout {
			--title: "Payout";
			--color: var(--blue);
	}

	.metadata span.comp {
			display: inline-block;
      background-color: rgba(var(--color), 0.1);
			padding: 0.2em 0.4em;
			border-radius: 0.2em;
			margin: -0.4em 0.2em -0.4em 0;
			font-size: 0.9em;
			text-align: center;
      font-weight: bold;
	}

	.metadata span.comp::before {
			content: '';
			display: block;
			font-size: .6em;
			text-transform: uppercase;
	}

	.metadata span.comp::before {
			content: var(--title);
			color: rgb(var(--color));
	}

	.none-found {
		display: block;
		color: rgb(var(--red));
		text-align: center;
	}
</style>
