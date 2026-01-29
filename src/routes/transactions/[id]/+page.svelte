<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faDatabase,
		faInfoCircle,
		faRepeat,
		faRotateLeft
	} from '@fortawesome/free-solid-svg-icons';
	import { relativeTime, formatCurrency } from '$lib/util';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import kromer from '$lib/api/kromer.js';
	import type { Transaction, TransactionMetadataEntry } from 'kromer';
	import Button from '$lib/components/ui/Button.svelte';
	import { t$ } from '$lib/i18n';

	const { data } = $props();

	// Make transaction reactive so it updates when navigating between transactions
	const transaction = $derived(data.transaction as Transaction);

	const transactionMetadata = $derived(kromer.transactions.parseMetadata(transaction));

	// Check if this is a refund transaction
	function findMeta(name: string): TransactionMetadataEntry | undefined {
		return transactionMetadata.entries.find((entry) => entry.name.toLowerCase() === name);
	}

	const refundType = $derived(findMeta('type'));
	const isRefund = $derived(refundType?.value?.toLowerCase() === 'refund');
	const refundRef = $derived(findMeta('ref'));
	const refundOriginal = $derived(findMeta('original'));

	// Fetch referenced transaction if this is a refund
	$effect(() => {
		if (isRefund && refundRef?.value) {
			kromer.transactions
				.get(Number(refundRef.value))
				.then((tx) => {
					console.log('Referenced transaction:', tx);
				})
				.catch((e) => {
					console.error('Failed to fetch referenced transaction:', e);
				});
		}
	});
</script>

<svelte:head>
	<title>Transaction #{transaction.id} | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span> <a href="/transactions">Transactions</a>
	<span>&raquo;</span>
	<a href="/transactions/{transaction.id}">#{transaction.id}</a>
</h1>

<div class="col-12 statistics">
	<div class="statistic">
		<div>
			<Button
				variant="primary"
				href="/transactions/new?to={transaction.to}&amount={transaction.value}&metadata={transaction.metadata}"
			>
				<FontAwesomeIcon icon={faRepeat} />
				Repeat
			</Button>
		</div>
	</div>
	<div class="statistic">
		<h2>ID</h2>
		<div>{transaction.id.toLocaleString()}</div>
	</div>
	{#if transaction.from}
		<div class="statistic">
			<h2>From</h2>
			<div><Address address={transaction.from} /></div>
		</div>
	{/if}
	<div class="statistic">
		<h2>To</h2>
		<div><Address address={transaction.to} /></div>
	</div>
	<div class="statistic">
		<h2>Amount</h2>
		<div>{formatCurrency(transaction.value)} <small>KRO</small></div>
	</div>
	<div class="statistic">
		<h2>Time</h2>
		<div title={new Date(transaction.time).toLocaleString()}>
			{relativeTime(transaction.time)}
		</div>
	</div>
</div>

{#if isRefund && refundRef?.value}
	<div class="col-12 refund-note">
		<FontAwesomeIcon icon={faRotateLeft} />
		{$t$('refund.reference')} <a href="/transactions/{refundRef.value}">#{refundRef.value}</a>
		{#if refundOriginal}
			{@const percentage = (transaction.value / Number(refundOriginal.value)) * 100}
			<span class="refund-stats">
				({formatCurrency(transaction.value)} of {formatCurrency(Number(refundOriginal.value))} KRO, {percentage.toFixed(
					0
				)}%)
			</span>
		{/if}
	</div>
{/if}

<Section lgCols={4} mdCols={12}>
	<h2><FontAwesomeIcon icon={faInfoCircle} /> Raw Information</h2>
	<div class="table-container">
		<table>
			<tbody>
				<tr>
					<th>Type</th>
					<td class="capitalize right">
						{transaction.type}
					</td>
				</tr>
				<tr>
					<th>From</th>
					<td class="right">
						{#if transaction.from}
							<Address address={transaction.from} />
						{:else}
							<small>Unknown Sender</small>
						{/if}
					</td>
				</tr>
				<tr>
					<th>To</th>
					<td class="right">
						<Address address={transaction.to} />
					</td>
				</tr>
				{#if transaction.sent_name}
					<tr>
						<th>Sent to Name</th>
						<td class="right">
							<code
								>{transaction.sent_metaname
									? `${transaction.sent_metaname}@`
									: ''}{transaction.sent_name}<small>.kro</small></code
							>
						</td>
					</tr>
				{/if}
				<tr>
					<th>Amount</th>
					<td class="right">
						{transaction.value.toFixed(2)} <small>KRO</small>
					</td>
				</tr>
				<tr>
					<th>Time</th>
					<td class="right">
						{transaction.time.toLocaleString()}
					</td>
				</tr>
				<tr>
					<th>Relative Time</th>
					<td class="right">
						{relativeTime(transaction.time)}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</Section>

<Section lgCols={8} mdCols={12}>
	<h2><FontAwesomeIcon icon={faDatabase} /> Metadata</h2>
	{#if transaction.metadata && transaction.metadata.length > 0}
		<strong>Raw Metadata:</strong>
		<code class="block">{transaction.metadata}</code>
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Value</th>
					</tr>
				</thead>
				<tbody>
					{#if transactionMetadata.minecraftPlayer}
						{@const player = transactionMetadata.minecraftPlayer}
						<tr>
							<th>Minecraft Player</th>
							<td>
								<img
									class="avatar"
									src="https://api.mineatar.io/face/{player.uuid}"
									alt="Player avatar for {player.name}"
								/>
								{player.name}
							</td>
						</tr>
					{/if}
					{#each transactionMetadata.entries as metadata (metadata.name)}
						<tr>
							{#if metadata?.value}
								<th class="caps">{metadata.name}</th>
								<td>
									{#if metadata.name === 'return' && metadata.value.length === 10}
										<a href="/addresses/{metadata.value}">
											{metadata.value}
										</a>
									{:else}
										{metadata.value}
									{/if}
								</td>
							{:else}
								<th><small>[no name]</small></th>
								<td>{metadata.name}</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<small>There is no metadata on this transaction!</small>
	{/if}
</Section>

<style>
	code.block {
		display: block;
		font-family: monospace;
		background-color: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.6rem 0.8rem;
		margin: 0.5rem 0;
		border-radius: 0.25rem;
	}

	.avatar {
		vertical-align: middle;
		width: 16px;
		height: 16px;
	}

	.capitalize {
		text-transform: capitalize;
	}

	/* Refund note styles */
	.refund-note {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		background-color: rgba(var(--yellow), 0.1);
		border-radius: 0.5rem;
		color: rgb(var(--yellow));
		font-size: 0.9rem;
	}

	.refund-note a {
		color: rgb(var(--yellow));
		font-weight: 600;
		text-decoration: underline;
		cursor: pointer;
	}

	.refund-note a:hover {
		text-decoration: none;
	}

	.refund-stats {
		color: var(--text-color-2);
		font-size: 0.85em;
	}
</style>
