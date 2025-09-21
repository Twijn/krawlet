<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import shopsync from '$lib/stores/shopsync';
	import type { Shop } from '$lib/types/shops';
	import { faShop } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import Address from '../addresses/Address.svelte';
	import { onMount } from 'svelte';
	import ModuleLoading from '../other/ModuleLoading.svelte';
	import ShopCard from '$lib/components/widgets/shops/ShopCard.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = null,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let shops: Shop[] = $state([]);

	onMount(() => {
		shopsync.subscribe((data) => {
			shops = data.data;
		});
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faShop} /> Shops</h2>
	{#if shops.length === 0}
		<ModuleLoading />
	{/if}
	<div class="shop-grid">
		{#each shops as shop (shop.computerId)}
			{@const items = shop.items ?? []}
			{@const totalStock = items.reduce((v, l) => v + l.stock, 0)}
			<ShopCard shop={shop}>
				<table>
					<tbody>
					<tr>
						<th>Total Items</th>
						<td class="right"
						>{items.length} <small>listing{items.length === 1 ? '' : 's'}</small></td
						>
					</tr>
					<tr>
						<th>Total Stock</th>
						<td class="right"
						>{totalStock.toLocaleString()}
							<small>item{totalStock === 1 ? '' : 's'}</small></td
						>
					</tr>
					{#if shop.addresses}
						{#each shop.addresses as address (address)}
							{#if address.length === 10 && address.startsWith('k')}
								<tr>
									<th>Address</th>
									<td class="right"><Address {address} /></td>
								</tr>
							{/if}
						{/each}
					{/if}
					</tbody>
				</table>
			</ShopCard>
		{/each}
	</div>
</Section>

<style>
	.shop-grid {
		--shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
		display: grid;
		grid-template-columns: 1fr;
		gap: 1em;
	}

	@media only screen and (min-width: 1100px) {
		.shop-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media only screen and (min-width: 1500px) {
		.shop-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media only screen and (min-width: 2000px) {
		.shop-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>
