<script lang="ts">
	import { goto } from '$app/navigation';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import ShopItems from '$lib/components/widgets/shops/ShopItems.svelte';
	import { cleanShopData, getShopById } from '$lib/stores/shopsync';
	import type { Shop } from '$lib/types/shops.js';
	import { relativeTime } from '$lib/util.js';
	import { onMount } from 'svelte';

	const { params } = $props();

	let shop = $state<Shop | null>(null);

	onMount(() => {
		shop = getShopById(params.id);
		if (!shop) {
			goto('/shops?error=not-found');
		}
	});

	let items = $derived(shop?.items ?? []);
</script>

<svelte:head>
	<title>{cleanShopData(shop?.name ?? '')} | Shops | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/shops">Shops</a> <span>&raquo;</span>
	<a href="/shops/{shop?.id ?? ''}">{cleanShopData(shop?.name ?? '')}</a>
</h1>

{#if shop}
	<div class="col-12 statistics">
		<div class="statistic">
			<h2>Shop Name</h2>
			<div>{cleanShopData(shop.name)}</div>
		</div>
		{#if shop.addresses}
			{#each shop.addresses as address (shop.id + ':' + address)}
				<div class="statistic">
					<h2>Address</h2>
					<div><Address {address} /></div>
				</div>
			{/each}
		{/if}
		{#if shop.owner}
			<div class="statistic">
				<h2>Owner</h2>
				<div>{cleanShopData(shop.owner)}</div>
			</div>
		{/if}
		<div class="statistic">
			<h2>Items</h2>
			<div>{items.length.toLocaleString()}</div>
		</div>
		<div class="statistic">
			<h2>Total Stock</h2>
			<div>{items.reduce((v, l) => v + l.stock, 0).toLocaleString()}</div>
		</div>
		{#if shop.updatedDate}
			{@const date = new Date(shop.updatedDate)}
			<div class="statistic">
				<h2>Last Updated</h2>
				<div title={date.toLocaleString()}>{relativeTime(date)}</div>
			</div>
		{/if}
		{#if shop.createdDate}
			{@const date = new Date(shop.createdDate)}
			<div class="statistic">
				<h2>First Seen</h2>
				<div title={date.toLocaleString()}>{relativeTime(date)}</div>
			</div>
		{/if}
	</div>

	<ShopItems bind:shop />
{:else}
	<ModuleLoading />
{/if}
