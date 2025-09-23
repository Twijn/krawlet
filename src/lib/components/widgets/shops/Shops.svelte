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
	import ShopFilterSort from './filtersort/ShopFilterSort.svelte';
	import { paramState } from '$lib/paramState.svelte';

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
	let searchQuery = paramState('q', '', {
		shouldSet: (value) => value.length > 0
	});
	let sortOption = paramState<'name-asc' | 'name-desc' | 'owner-asc' | 'owner-desc'>(
		'sort',
		'name-asc',
		{
			shouldSet: (value) =>
				['name-asc', 'name-desc', 'owner-asc', 'owner-desc'].includes(value) && value !== 'name-asc'
		}
	);

	let filteredShops: Shop[] = $state([]);

	$effect(() => {
		let filtered = [...shops];
		if (searchQuery.value) {
			filtered = filtered.filter(
				(shop) =>
					shop.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
					(shop?.owner && shop.owner.toLowerCase().includes(searchQuery.value.toLowerCase()))
			);
		}
		filtered.sort((a, b) => {
			switch (sortOption.value) {
				case 'name-asc':
					return a.name.localeCompare(b.name);
				case 'name-desc':
					return b.name.localeCompare(a.name);
				case 'owner-asc':
					return (a?.owner ?? '').localeCompare(b?.owner ?? '');
				case 'owner-desc':
					return (b.owner ?? '').localeCompare(a?.owner ?? '');
				default:
					return 0;
			}
		});
		filteredShops = filtered;
	});

	onMount(() => {
		shopsync.subscribe((data) => {
			shops = data.data;
		});
	});
</script>

<ShopFilterSort bind:searchQuery={searchQuery.value} bind:sortOption={sortOption.value} />
<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faShop} /> Shops</h2>
	{#if shops.length === 0}
		<ModuleLoading />
	{/if}
	<div class="shop-grid">
		{#each filteredShops as shop (shop.computerId)}
			{@const items = shop.items ?? []}
			{@const totalStock = items.reduce((v, l) => v + l.stock, 0)}
			<ShopCard {shop}>
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
