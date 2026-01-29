<script lang="ts">
	import {
		canBuyListing,
		getItemImageUrl,
		getListingBuyLink,
		getRelativeItemUrl,
		type ItemListing
	} from '$lib/stores/shopsync';
	import type { Listing } from '$lib/types/shops';
	import Button from '$lib/components/ui/Button.svelte';
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
			<Button variant="primary" href={getRelativeItemUrl(item)}>View Item</Button>
		{/if}
	</div>
</div>

<style>
	.item {
		position: relative;
		display: flex;
		gap: 1rem;
		flex-direction: column;
		background-color: var(--background-color-2);
		min-width: 0;
		max-width: 100%;
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 1px rgba(255, 255, 255, 0.1) inset;
		transition: all 0.2s ease;
	}

	.item:hover {
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.4),
			0 0 1px rgba(255, 255, 255, 0.15) inset;
		border-color: rgba(255, 255, 255, 0.12);
		transform: translateY(-2px);
	}

	.item-head {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.item-head img {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.item-head-text {
		flex: 1;
		min-width: 0;
	}

	.item-head-text h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		text-transform: capitalize;
		color: var(--text-color-1);
	}

	.item-head-text small {
		font-size: 0.875rem;
		color: var(--text-color-2);
	}

	.item-body {
		flex-grow: 1;
	}

	.buttons {
		display: flex;
		gap: 0.5rem;
		margin-top: auto;
	}
</style>
