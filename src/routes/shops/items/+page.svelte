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

	let listings: ItemListing[] = $state([]);

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

<Section lgCols={12}>
	<h2><FontAwesomeIcon icon={faListNumeric} /> Items</h2>
	{#if listings.length === 0}
		<ModuleLoading />
	{/if}
	<div class="item-grid">
		{#each listings as listing (listing.itemName + (':' + listing.itemNbt))}
			<div class="item">
				<div class="item-head">
					<img
						src="https://shops.alexdevs.me/assets/items/{listing.itemName.replace(':', '/')}.png"
						alt="Item icon for {listing.itemDisplayName}"
					/>
					<div class="item-head-text">
						<h3>{listing.itemDisplayName}</h3>
						<small title={listing.itemNbt ? `NBT: ${listing.itemNbt}` : undefined}
							>{listing.itemName}</small
						>
					</div>
				</div>
				<div class="item-body table-container">
					<table>
						<thead>
							<tr>
								<th>Shop Name</th>
								<th>Stock</th>
								<th>Price</th>
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
				</div>
			</div>
		{/each}
	</div>
</Section>
