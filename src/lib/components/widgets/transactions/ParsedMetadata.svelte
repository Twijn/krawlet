<script lang="ts">
	import type { TransactionMetadata, TransactionMetadataEntry, TransactionWithMeta } from 'kromer';
	import shopsync, { getItemImageUrl, getRelativeItemUrl } from '$lib/stores/shopsync';
	import type { Listing } from '$lib/types/shops';
	import settings from '$lib/stores/settings';
	import { onMount } from 'svelte';
	import { formatCurrency } from '$lib/util';

	const SPECIAL_META: string[] = ['winner', 'loser', 'payout'];

	const {
		transaction,
		limitWidth
	}: {
		transaction: TransactionWithMeta;
		limitWidth: boolean;
	} = $props();

	const meta = transaction.meta ?? { entries: [] };

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

	let relatedListing: Listing | null = $state(null);
	let quantity: number = $state(0);

	onMount(() => {
		if ($settings.parsePurchaseItem) {
			const valueOnlyMeta = meta.entries.filter((e) => !e.value).map((e) => e.name.toLowerCase());
			if (valueOnlyMeta.length > 0) {
				const shops = $shopsync.data.filter((s) => s.addresses?.includes(transaction.to));
				const listings = shops.reduce((listings, s) => {
					if (s.items) {
						listings = [
							...listings,
							...s.items.filter((i) =>
								i.prices?.find(
									(p) =>
										p.currency.toLowerCase() === 'kro' &&
										valueOnlyMeta.includes(p.requiredMeta?.toLowerCase() ?? '')
								)
							)
						];
					}
					return listings;
				}, [] as Listing[]);
				if (listings.length > 0) {
					relatedListing = listings[0];
					if ($settings.parsePurchaseItemQuantity) {
						quantity = Math.floor(
							transaction.value /
								(relatedListing.prices?.find((p) => p.currency.toLowerCase() === 'kro')?.value ?? 1)
						);
					}
					if (listings.length > 1) {
						console.warn(
							'Multiple listings found for transaction metadata:',
							transaction,
							listings
						);
					}
				}
			}
		}
	});
</script>

<div class="metadata" class:limit-width={limitWidth && !relatedListing}>
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
	{:else if relatedListing}
		<a class="item" href={getRelativeItemUrl(relatedListing)}>
			<img
				src={getItemImageUrl(relatedListing)}
				alt="Item icon for {relatedListing.itemDisplayName}"
			/>
			<div class="item-info">
				<strong
					>{relatedListing.itemDisplayName}
					<small>{quantity > 0 ? `x${quantity.toLocaleString()}` : ''}</small></strong
				>
				{#if $settings.parsePurchaseItemQuantity && relatedListing?.prices}
					{@const price = relatedListing.prices.find((p) => p.currency.toLowerCase() === 'kro')}
					{#if price}
						<div class="each">{formatCurrency(price.value)} KRO each</div>
					{/if}
				{/if}
			</div>
		</a>
	{:else if displayMeta}
		<span
			class="display-meta"
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
		max-width: 20em;
	}

	.metadata span {
		display: block;
		max-width: 100%;
		overflow: hidden;
	}

	.metadata span.error {
		--message-color: var(--red);
	}

	.metadata span.message {
		--message-color: var(--blue);
	}

	.display-meta {
		color: rgb(var(--message-color));
		font-weight: bold;
	}

	.display-meta:not(.error):not(.message) {
		color: var(--text-color-2);
		font-style: italic;
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

	.item {
		display: flex;
		align-items: center;
		gap: 0.25em;
		color: white;
		text-decoration: none;
	}

	.item img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}

	.each {
		font-size: 0.8em;
		opacity: 0.8;
	}
</style>
