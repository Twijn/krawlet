<script lang="ts">
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import ShopItems from '$lib/components/widgets/shops/ShopItems.svelte';
	import ShopAddressStats from '$lib/components/widgets/shops/ShopAddressStats.svelte';
	import { cleanShopData } from '$lib/stores/shopsync';
	import { relativeTime } from '$lib/util.js';
	import { t$ } from '$lib/i18n';

	const { data } = $props();
	const { shop } = data;

	let items = $derived(shop?.items ?? []);
</script>

<svelte:head>
	<title>{cleanShopData(shop?.name ?? '')} | Shops | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/shops">{$t$('nav.shops')}</a> <span>&raquo;</span>
	<a href="/shops/{shop?.id ?? ''}">{cleanShopData(shop?.name ?? '')}</a>
</h1>

{#if shop}
	<div class="col-12 statistics">
		<div class="statistic">
			<h2>{$t$('shop.shopName')}</h2>
			<div>{cleanShopData(shop.name)}</div>
		</div>
		{#if shop.addresses}
			{#each shop.addresses as address (shop.id + ':' + address)}
				<div class="statistic">
					<h2>{$t$('shop.address')}</h2>
					<div><Address {address} /></div>
				</div>
			{/each}
		{/if}
		{#if shop.owner}
			<div class="statistic">
				<h2>{$t$('name.owner')}</h2>
				<div>{cleanShopData(shop.owner)}</div>
			</div>
		{/if}
		<div class="statistic">
			<h2>{$t$('shop.items')}</h2>
			<div>{items.length.toLocaleString()}</div>
		</div>
		<div class="statistic">
			<h2>{$t$('shop.totalStock')}</h2>
			<div>{items.reduce((v, l) => v + l.stock, 0).toLocaleString()}</div>
		</div>
		{#if shop.updatedDate}
			{@const date = new Date(shop.updatedDate)}
			<div class="statistic">
				<h2>{$t$('shop.lastUpdated')}</h2>
				<div title={date.toLocaleString()}>{relativeTime(date)}</div>
			</div>
		{/if}
		{#if shop.createdDate}
			{@const date = new Date(shop.createdDate)}
			<div class="statistic">
				<h2>{$t$('shop.firstSeen')}</h2>
				<div title={date.toLocaleString()}>{relativeTime(date)}</div>
			</div>
		{/if}
	</div>

	<ShopItems {shop} />

	<ShopAddressStats {shop} />
{:else}
	<ModuleLoading>
		<Skeleton variant="rectangular" width="100%" height="300px" />
	</ModuleLoading>
{/if}
