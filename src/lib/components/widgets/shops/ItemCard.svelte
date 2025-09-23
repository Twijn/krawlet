<script lang="ts">
	import {
		canBuyListing,
		getItemImageUrl,
		getListingBuyLink,
		type ItemListing
	} from '$lib/stores/shopsync';
	import type { Listing } from '$lib/types/shops';
	import Button from '$lib/components/ui/Button.svelte';

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

	{#if showBadges && 'id' in item && (item?.dynamicPrice || item?.madeOnDemand || item?.requiresInteraction)}
		<div class="badges">
			{#if item.shopBuysItem}
				<span class="badge badge-sell" title="This shop purchases this item rather than selling it"
					>Sell Shop</span
				>
			{/if}
			{#if item.dynamicPrice}
				<span class="badge badge-dynamic" title="The price for this listing will dynamically change"
					>Dynamic Price</span
				>
			{/if}
			{#if item.madeOnDemand}
				<span class="badge badge-demand" title="This item is when the purchase is completed"
					>Made on Demand</span
				>
			{/if}
			{#if item.requiresInteraction}
				<span
					class="badge badge-interaction"
					title="This requires interaction with the shop's monitor, chatbox, etc."
					>Requires Interaction</span
				>
			{/if}
		</div>
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
			<Button variant="primary" href="/shops/items/{item.itemName.replace(/:/g, '/')}">
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

	.badges {
		display: flex;
		justify-content: center;
		gap: 0.5em;
		margin-bottom: 0.5em;
	}

	.badge-dynamic {
		--color: var(--green);
	}

	.badge-demand {
		--color: var(--blue);
	}

	.badge-interaction {
		--color: var(--red);
	}

	.badge-sell {
		--color: var(--red);
		font-weight: 500;
	}

	.badge {
		background: rgba(var(--color), 0.2);
		color: white;
		border-radius: 0.5em;
		padding: 0.2em 0.7em;
		font-size: 0.85em;
		font-weight: 500;
		white-space: nowrap;
		border: 1px solid rgba(var(--color), 0.4);
	}
</style>
