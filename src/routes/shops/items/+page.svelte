<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import shopsync, {
		cleanShopData,
		getListingsByItem,
		type ItemListing
	} from '$lib/stores/shopsync';
	import { formatCurrency } from '$lib/util';
	import { faListNumeric } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onMount } from 'svelte';
	import ItemCard from '$lib/components/widgets/shops/ItemCard.svelte';
	import { paramState } from '$lib/paramState.svelte';
	import FilterSortControls from '$lib/components/widgets/shops/filtersort/ItemFilterSort.svelte';

	let listings: ItemListing[] = $state([]);

	let searchQuery = paramState('q', '', {
		shouldSet: (v) => v.length > 0
	});
	let sortOption = paramState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>(
		'sort',
		'name-asc',
		{
			shouldSet: (v) => ['name-desc', 'price-asc', 'price-desc'].includes(v)
		}
	);

	let filteredListings = $derived(
		listings
			.filter(
				(listing) =>
					listing.itemName.toLowerCase().includes(searchQuery.value) ||
					listing.itemDisplayName.toLowerCase().includes(searchQuery.value)
			)
			.sort((a, b) => {
				switch (sortOption.value) {
					case 'name-asc':
						return a.itemDisplayName.localeCompare(b.itemDisplayName);
					case 'name-desc':
						return b.itemDisplayName.localeCompare(a.itemDisplayName);
					case 'price-asc':
						return (
							(a.shops[0]?.listing.prices?.[0]?.value || 0) -
							(b.shops[0]?.listing.prices?.[0]?.value || 0)
						);
					case 'price-desc':
						return (
							(b.shops[0]?.listing.prices?.[0]?.value || 0) -
							(a.shops[0]?.listing.prices?.[0]?.value || 0)
						);
					default:
						return 0;
				}
			})
	);

	onMount(() => {
		shopsync.subscribe((shops) => {
			listings = getListingsByItem(shops);
		});
	});
</script>

<svelte:head>
	<title>Shop Items | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/shops">Shops</a> <span>&raquo;</span>
	<a href="/shops/items">Items</a>
</h1>

<FilterSortControls bind:searchQuery={searchQuery.value} bind:sortOption={sortOption.value} />

<Section lgCols={12}>
	<h2><FontAwesomeIcon icon={faListNumeric} /> Items</h2>
	{#if listings.length === 0}
		<ModuleLoading />
	{/if}
	<div class="item-grid">
		{#each filteredListings as listing (listing.itemName + (':' + listing.itemNbt))}
			<ItemCard item={listing} showBadges={false}>
				<table>
					<thead>
						<tr>
							<th>Shop Name</th>
							<th class="right">Stock</th>
							<th class="right">Price</th>
						</tr>
					</thead>
					<tbody>
						{#each listing.shops as shop (shop.listing.id)}
							{@const stock = shop.listing.stock}
							<tr>
								<td>
									<a href="/shops/{shop.id}">{cleanShopData(shop.name)}</a>
								</td>
								<td class="right">
									{stock.toLocaleString()}
								</td>
								<td class="right">
									{#if shop.listing.prices?.[0].value}
										{@const price = shop.listing.prices[0]}
										{formatCurrency(price.value)}
										<small>{price.currency}</small>
									{:else}
										N/A
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</ItemCard>
		{/each}
	</div>
</Section>
