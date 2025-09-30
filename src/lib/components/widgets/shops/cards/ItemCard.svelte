<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import {
		canBuyListing,
		getItemImageUrl,
		getListingBuyLink,
		type ItemListing
	} from '$lib/stores/shopsync';
	import type { Listing } from '$lib/types/shops';
	import ItemBadges from '../ItemBadges.svelte';

	const {
		item,
		children,
		showBadges = true,
		showPurchaseLink = true,
		showViewLink = true
	}: {
		item: Listing | ItemListing;
		children: unknown;
		showBadges?: boolean;
		showPurchaseLink?: boolean;
		showViewLink?: boolean;
	} = $props();
</script>

<div class="item">
	<div class="item-head">
		<img src={getItemImageUrl(item)} alt="Item icon for {item.itemDisplayName}" />
		<div class="item-head-text">
			<h3>{item.itemDisplayName}</h3>
			<small title={item.itemNbt ? `NBT: ${item.itemNbt}` : undefined}>{item.itemName}</small>
		</div>
	</div>

	{#if showBadges && 'id' in item}
		<ItemBadges {item} />
	{/if}

	<div class="item-body">
		{#if typeof children === 'function'}
			{@render children()}
		{/if}
	</div>

	<div class="buttons">
		{#if showPurchaseLink && 'id' in item}
			{@const href = getListingBuyLink(item)}
			{#if 'id' in item}
				{@const stock = item.stock ?? 0}
				<Button
					variant="secondary"
					disabled={stock <= 0 || !canBuyListing(item)}
					{href}
					newTab={href.includes('krist.club')}
					title={stock <= 0
						? 'This item is currently out of stock.'
						: !canBuyListing(item)
							? "This item can't be purchased through Krawlet."
							: undefined}
				>
					Purchase {item.itemDisplayName}
				</Button>
			{/if}
		{/if}

		{#if showViewLink}
			<Button
				variant="primary"
				href="/shops/items/{item.itemName.replace(/:/g, '/')}{item.itemNbt
					? `?nbt=${encodeURIComponent(item.itemNbt)}`
					: ''}"
			>
				View Item
			</Button>
		{/if}
	</div>
</div>

<style>
	.item {
		display: flex;
		gap: 0.75em;
		flex-direction: column;
		background-color: var(--background-color-1);
		min-width: 0;
		max-width: 100%;
		padding: 0.8em;
		border-radius: 0.75em 0.25em;
		box-shadow: var(--shadow);
	}

	.item-head {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.item-head img {
		width: 48px;
		height: 48px;
	}

	.item-head-text h3 {
		font-size: 1.2em;
		font-weight: 500;
		margin: 0;
		text-transform: capitalize;
	}

	.item-body {
		flex-grow: 1;
	}
</style>
