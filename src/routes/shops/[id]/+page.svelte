<script lang="ts">
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import ShopItems from '$lib/components/widgets/shops/ShopItems.svelte';
	import { cleanShopData } from '$lib/stores/shopsync';
	import { relativeTime } from '$lib/util.js';
	import { t$ } from '$lib/i18n';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';

	const { data } = $props();
	const { shop } = data;

	let items = $derived(shop?.items ?? []);

	const addresses = $derived(shop?.addresses?.filter((a) => /^k[a-z0-9]{9}$/.test(a)) ?? []);
	const names = $derived.by(() => {
		const entries = shop?.addresses ?? [];
		const uniqueNames: string[] = [];

		entries
			.filter((entry) => !/^k[a-z0-9]{9}$/i.test(entry))
			.forEach((entry) => {
				const lower = entry.toLowerCase();
				const withoutMeta = lower.includes('@') ? lower.split('@').at(-1) ?? lower : lower;
				const baseName = withoutMeta.endsWith('.kro')
					? withoutMeta.slice(0, withoutMeta.length - 4)
					: withoutMeta;

				if (baseName && !uniqueNames.includes(baseName)) {
					uniqueNames.push(baseName);
				}
			});

		return uniqueNames;
	});
</script>

<svelte:head>
	<title>{cleanShopData(shop?.name ?? '')} | Shops | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: $t$('nav.shops'), href: '/shops' },
		{ label: cleanShopData(shop?.name ?? ''), href: `/shops/${shop?.id ?? ''}` }
	]}
/>

{#if shop}
	<div class="col-12 statistics">
		<div class="statistic">
			<h2>{$t$('shop.shopName')}</h2>
			<div>{cleanShopData(shop.name)}</div>
		</div>
		{#if addresses.length > 0}
			{#each addresses as address (shop.id + ':' + address)}
				<div class="statistic">
					<h2>{$t$('shop.address')}</h2>
					<div><Address {address} /></div>
				</div>
			{/each}
		{/if}
		{#if names.length > 0}
			{#each names as name (shop.id + ':name:' + name)}
				<div class="statistic">
					<h2>{$t$('shop.name')}</h2>
					<div class="name-display">
						<code>{name}<small>.kro</small></code>
					</div>
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
{:else}
	<ModuleLoading>
		<Skeleton variant="rectangular" width="100%" height="300px" />
	</ModuleLoading>
{/if}
