<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import { canBuyListing, getListingBuyLink } from '$lib/stores/shopsync';
	import type { Shop, Listing } from '$lib/types/shops';
	import { formatCurrency } from '$lib/util';
	import { faListNumeric } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		shop = $bindable()
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		shop: Shop;
	} = $props();

	const items = $derived<Listing[]>(shop?.items ?? []);
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faListNumeric} /> Items</h2>
	<div class="item-grid">
		{#each items as item (item.shopId + ':' + item.id)}
			{@const stock = item.stock ?? 0}
			<div class="item">
				<div class="item-head">
					<img
						src="https://shops.alexdevs.me/assets/items/{item.itemName.replace(':', '/')}.png"
						alt="Item icon for {item.itemDisplayName}"
					/>
					<div class="item-head-text">
						<h3>{item.itemDisplayName}</h3>
						<small title={item.itemNbt ? `NBT: ${item.itemNbt}` : undefined}>{item.itemName}</small>
					</div>
				</div>
				{#if item.dynamicPrice || item.madeOnDemand || item.requiresInteraction}
					<div class="badges">
						{#if item.dynamicPrice}
							<span
								class="badge badge-dynamic"
								title="The price for this listing will dynamically change">Dynamic Price</span
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
				<div class="item-body table-container">
					<table>
						<tbody>
							<tr>
								<th>Stock</th>
								<td class="right">
									{stock.toLocaleString()} <small>item{stock === 1 ? '' : 's'}</small>
								</td>
							</tr>
							{#each item.prices ?? [] as price (price.id)}
								{@const priceValue = Number(price.value)}
								<tr>
									<th>Price <small>({price.currency})</small></th>
									<td class="right">{formatCurrency(priceValue)} <small>{price.currency}</small></td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if canBuyListing(item)}
					{@const href = getListingBuyLink(item)}
					<div class="buttons">
						{#if stock <= 0}
							<small class="center fail">This item is currently out of stock.</small>
						{/if}

						<Button
							variant="primary"
							disabled={stock <= 0}
							{href}
							newTab={href.includes('krist.club')}
						>
							Purchase {item.itemDisplayName}
						</Button>
					</div>
				{:else}
					<small class="center fail">This item can't be purchased through Krawlet.</small>
				{/if}
			</div>
		{/each}
		{#if items.length === 0}
			<p>No items found for this shop.</p>
		{/if}
	</div>
</Section>

<style>
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
