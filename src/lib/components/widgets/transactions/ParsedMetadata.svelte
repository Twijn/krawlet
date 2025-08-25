<script lang="ts">
	import type { TransactionMetadata, TransactionMetadataEntry } from 'kromer';

	const SPECIAL_META: string[] = ['winner', 'loser', 'payout'];

	const {
		meta,
		limitWidth
	}: {
		meta: TransactionMetadata;
		limitWidth: boolean;
	} = $props();

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

	const displayMeta = findDisplayMeta(meta);
</script>

<div class="metadata" class:limit-width={limitWidth}>
	{#if meta.entries.find((x) => SPECIAL_META.includes(x.name.toLowerCase()))}
		{#each meta.entries.filter( (x) => SPECIAL_META.includes(x.name.toLowerCase()) ) as entry (entry.name + ':' + entry.value)}
			{@const name = entry.name.toLowerCase()}
			{@const payout = Number(entry.value)}
			{#if name === 'payout' && !isNaN(payout) && payout > 0}
				<span class="comp comp-payout">
					{payout.toFixed(2)} <small>KRO</small>
				</span>
			{:else}
				<span
					class="comp"
					class:comp-winner={name === 'winner'}
					class:comp-loser={name === 'loser'}
				>
					{entry.value ?? '?'}
				</span>
			{/if}
		{/each}
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
</div>

<style>
	.metadata.limit-width {
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
		--title: 'Winner';
		--color: var(--green);
	}

	.metadata span.comp-loser {
		--title: 'Loser';
		--color: var(--red);
	}

	.metadata span.comp-payout {
		--title: 'Payout';
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
		font-size: 0.6em;
		text-transform: uppercase;
	}

	.metadata span.comp::before {
		content: var(--title);
		color: rgb(var(--color));
	}
</style>
