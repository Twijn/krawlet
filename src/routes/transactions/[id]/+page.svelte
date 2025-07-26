<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faDatabase, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
	import { relativeTime } from '$lib/util';
	import type { Transaction } from '$lib/api/types/Transaction';
	import kromer from '$lib/api/kromer';

	const { data } = $props();
	const {
		transaction
	}: {
		transaction: Transaction;
	} = data;

	const transactionMetadata = kromer.parseMetadata(transaction);
</script>

<svelte:head>
	<title>Transaction #{transaction.id} | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span> <a href="/transactions">Transactions</a>
	<span>&raquo;</span>
	<a href="/transactions/{transaction.id}">#{transaction.id}</a>
</h1>

<Section lgCols={4}>
	<h2><FontAwesomeIcon icon={faInfoCircle} /> Raw Information</h2>
	<div class="table-container">
		<table>
			<tbody>
				<tr>
					<th>From</th>
					<td class="right">
						<a href="/address/{transaction.from}">{transaction.from}</a>
					</td>
				</tr>
				<tr>
					<th>To</th>
					<td class="right">
						<a href="/address/{transaction.to}">{transaction.to}</a>
					</td>
				</tr>
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

<Section lgCols={8}>
	<h2><FontAwesomeIcon icon={faDatabase} /> Metadata</h2>
	{#if transaction.metadata && transaction.metadata.length > 0}
		<strong>Raw Metadata:</strong>
		<code class="block">{transaction.metadata}</code>
		<div class="table-container">
			<table>
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
										<a href="/address/{metadata.value}">
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
</style>
