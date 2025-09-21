<script lang="ts">
	import { goto } from '$app/navigation';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { cleanShopData, getItemImageUrl, getListing, type ItemListing } from '$lib/stores/shopsync';
	import { onMount } from 'svelte';
	import type { Shop } from '$lib/types/shops';

	const { params } = $props();

	let item = $state<ItemListing | null>(null);

	onMount(() => {
		item = getListing(params.itemname, params.modid);
		if (!item) {
			goto('/shops/items?error=not-found');
		}
	});

	let lowestShop: {Shop}|null = $state(null);
	let highestShop: Shop|null = $state(null);
	let marketValue: number = $state(0);

	$effect(() => {
		if (!item) return;

		lowestShop = null;
		highestShop = null;
		let count = 0;
		let total = 0;

		item.shops.forEach(shop => {
			if (!shop?.listing?.prices) return;
			shop.listing.prices.forEach(price => {
				if (price.currency.toLowerCase() !== 'kro') return;
				if (!lowestShop || lowestShop.)
				total += price.value;
			  count++;
			});
		})
	})
</script>

<svelte:head>
	<title>{cleanShopData(item?.itemDisplayName ?? '')} | Shop Items | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/shops">Shops</a> <span>&raquo;</span>
	<a href="/shops/items">Items</a> <span>&raquo;</span>
	<a href="/shops/items/{item?.itemName.replace(/:/g, '/')}">{cleanShopData(item?.itemDisplayName ?? '')}</a>
</h1>

{#if item}
	<div class="col-12 statistics">
		<div class="statistic">
			<img src={getItemImageUrl(item)} alt="{item.itemDisplayName}">
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
			<div>{Math.min(...item.shops.map(s => s.listing?.prices?.[0]?.value ?? Infinity))}</div>
		</div>
		<div class="statistic">
			<h2>Highest Price</h2>
			<div>{Math.max(...item.shops.map(s => s.listing?.prices?.[0]?.value ?? -Infinity))}</div>
		</div>
		<div class="statistic">
			<h2>Market Value</h2>
			<div>
				{item.shops.length
					? item.shops.reduce((sum, shop) => {
					const price = shop.listing?.prices?.[0]?.value;
					if (typeof price !== 'number') return sum;
					return sum + price;
				}, 0) / item.shops.filter(shop => typeof shop.listing?.prices?.[0]?.value === 'number').length
					: 0}
			</div>
		</div>
	</div>

	// show more
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
