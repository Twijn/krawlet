<script lang="ts">
	import shopsync from '$lib/stores/shopsync';
	import type { Shop } from '$lib/types/shops';
	import { onMount } from 'svelte';
	import { t$ } from '$lib/i18n';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let loading: boolean = $state(true);
	let shops: Shop[] = $state([]);

	let totalShops = $derived(shops.length);
	let totalListings = $derived(shops.reduce((sum, shop) => sum + (shop.items?.length ?? 0), 0));
	let totalStock = $derived(
		shops.reduce((sum, shop) => sum + (shop.items?.reduce((s, item) => s + item.stock, 0) ?? 0), 0)
	);
	let uniqueOwners = $derived(new Set(shops.map((shop) => shop.owner).filter(Boolean)).size);

	onMount(() => {
		shopsync.subscribe((data) => {
			shops = data.data;
			loading = data.data.length === 0;
		});
	});
</script>

<div
	class="col-{lgCols} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''} statistics"
>
	<div class="statistic">
		<h2>{$t$('stats.totalShops')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{totalShops.toLocaleString()}
			{/if}
		</div>
	</div>
	<div class="statistic">
		<h2>{$t$('stats.totalListings')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{totalListings.toLocaleString()}
			{/if}
		</div>
	</div>
	<div class="statistic">
		<h2>{$t$('stats.totalStock')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{totalStock.toLocaleString()} <small>{$t$('shop.items')}</small>
			{/if}
		</div>
	</div>
	<div class="statistic mobile-hide">
		<h2>{$t$('stats.uniqueOwners')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{uniqueOwners.toLocaleString()}
			{/if}
		</div>
	</div>
</div>

<style>
	.loading {
		opacity: 0.5;
	}
</style>
