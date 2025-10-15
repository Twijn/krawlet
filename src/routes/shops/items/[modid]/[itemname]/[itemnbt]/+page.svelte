<script lang="ts">
	import { goto } from '$app/navigation';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import {
		cleanShopData,
		getItemImageUrl,
		getListing,
		type ItemListing,
		type ShopWithListing
	} from '$lib/stores/shopsync';
	import { onMount } from 'svelte';
	import { formatCurrency } from '$lib/util';
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faShop } from '@fortawesome/free-solid-svg-icons';
	import ShopCard from '$lib/components/widgets/shops/cards/ShopCard.svelte';
	import ItemBadges from '$lib/components/widgets/shops/ItemBadges.svelte';

	const { params } = $props();

	let item = $state<ItemListing | null>(null);

	onMount(() => {
		item = getListing(params.itemname, params.modid, params.itemnbt);
		if (!item) {
			goto('/shops/items?error=not-found');
		}
	});

	let lowestShop: ShopWithListing | null = $state(null);
	let highestShop: ShopWithListing | null = $state(null);
	let marketValue: number = $state(0);

	$effect(() => {
		if (!item) return;

		const parsePrice = (shop: ShopWithListing) => Number(shop.listing?.prices?.[0]?.value);

		lowestShop = item.shops.reduce(
			(lowest, shop) => {
				const price = parsePrice(shop);
				if (isNaN(price)) return lowest;
				if (!lowest || price < parsePrice(lowest)) return shop;
				return lowest;
			},
			null as ShopWithListing | null
		);

		highestShop = item.shops.reduce(
			(highest, shop) => {
				const price = parsePrice(shop);
				if (isNaN(price)) return highest;
				if (!highest || price > parsePrice(highest)) return shop;
				return highest;
			},
			null as ShopWithListing | null
		);

		const validPrices = item.shops.map(parsePrice).filter((price) => !isNaN(price));

		marketValue = validPrices.length
			? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
			: 0;
	});
</script>

<svelte:head>
	<title>{cleanShopData(item?.itemDisplayName ?? '')} | Shop Items | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/shops">Shops</a> <span>&raquo;</span>
	<a href="/shops/items">Items</a> <span>&raquo;</span>
	<a href="/shops/items/{item?.itemName.replace(/:/g, '/')}"
		>{cleanShopData(item?.itemDisplayName ?? '')}</a
	>
</h1>

{#if item}
	{@const lowestPrice = lowestShop?.listing?.prices?.[0]?.value}
	{@const highestPrice = highestShop?.listing?.prices?.[0]?.value}
	<div class="col-12 statistics">
		<div class="statistic">
			<img src={getItemImageUrl(item)} alt={item.itemDisplayName} />
		</div>
		<div class="statistic">
			<h2>Item Name</h2>
			<div>{cleanShopData(item.itemDisplayName)}</div>
		</div>
		<div class="statistic">
			<h2>Shops</h2>
			<div>{item.shops.length}</div>
		</div>
		<div class="statistic">
			<h2>Lowest Price</h2>
			<div>
				{#if lowestPrice}
					{formatCurrency(lowestPrice)}
					<small>KRO</small>
				{:else}
					N/A
				{/if}
			</div>
		</div>
		<div class="statistic">
			<h2>Highest Price</h2>
			<div>
				{#if highestPrice}
					{formatCurrency(highestPrice)}
					<small>KRO</small>
				{:else}
					N/A
				{/if}
			</div>
		</div>
		<div class="statistic">
			<h2>Market Value</h2>
			<div>
				{#if marketValue}
					{formatCurrency(marketValue)}
					<small>KRO</small>
				{:else}
					N/A
				{/if}
			</div>
		</div>
	</div>

	<Section lgCols={12}>
		<h2><FontAwesomeIcon icon={faShop} /> Shops</h2>
		<div class="shop-grid">
			{#each item.shops as shop (shop.listing.id)}
				{@const stock = Number(shop.listing.stock)}
				<ShopCard {shop}>
					<ItemBadges item={shop.listing} />
					<div class="table-container">
						<table>
							<tbody>
								<tr>
									<th>Stock</th>
									<td class="right">
										{stock.toLocaleString()} <small>item{stock === 1 ? '' : 's'}</small>
									</td>
								</tr>
								{#each shop.listing.prices ?? [] as price (price.id)}
									{@const priceValue = Number(price.value)}
									<tr>
										<th>Price <small>({price.currency})</small></th>
										<td class="right"
											>{formatCurrency(priceValue)} <small>{price.currency}</small></td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</ShopCard>
			{/each}
		</div>
	</Section>
{:else}
	<ModuleLoading />
{/if}

<style>
	.statistic:has(img) {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1em;
	}

	.statistics img {
		width: 3em;
		height: 3em;
	}
</style>
