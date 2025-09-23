<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import type { Shop } from '$lib/types/shops';
	import { formatCurrency } from '$lib/util';
	import { faListNumeric } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ItemCard from '$lib/components/widgets/shops/ItemCard.svelte';
	import ItemFilterSort from './filtersort/ItemFilterSort.svelte';
	import { paramState } from '$lib/paramState.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		shop = $bindable()
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		shop: Shop;
	} = $props();

	let searchQuery = paramState('q', '', {
		shouldSet: (value) => value.length > 0
	});
	let sortOption = paramState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>(
		'sort',
		'name-asc',
		{
			shouldSet: (value) =>
				['name-asc', 'name-desc', 'price-asc', 'price-desc'].includes(value) && value !== 'name-asc'
		}
	);

	const items = $derived(
		(shop?.items ?? [])
			.filter(
				(item) =>
					item.itemName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
					item?.itemDisplayName?.toLowerCase().includes(searchQuery.value.toLowerCase())
			)
			.sort((a, b) => {
				switch (sortOption.value) {
					case 'name-asc':
						if (!a?.itemDisplayName || !b?.itemDisplayName) return 0;
						return a.itemDisplayName.localeCompare(b.itemDisplayName);
					case 'name-desc':
						if (!a?.itemDisplayName || !b?.itemDisplayName) return 0;
						return b.itemDisplayName.localeCompare(a.itemDisplayName);
					case 'price-asc':
						return (a.prices?.[0]?.value ?? 0) - (b.prices?.[0]?.value ?? 0);
					case 'price-desc':
						return (b.prices?.[0]?.value ?? 0) - (a.prices?.[0]?.value ?? 0);
					default:
						return 0;
				}
			})
	);
</script>

<ItemFilterSort bind:searchQuery={searchQuery.value} bind:sortOption={sortOption.value} />
<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faListNumeric} /> Items</h2>
	<div class="item-grid">
		{#each items as item (item.shopId + ':' + item.id)}
			{@const stock = item.stock ?? 0}
			<ItemCard {item}>
				<div class="item-body table-container">
					<table>
						<tbody>
							<tr>
								<th>Stock</th>
								<td class="right">
									{stock.toLocaleString()} <small>item{stock === 1 ? '' : 's'}</small>
								</td>
							</tr>
							{#each item.prices ?? [] as price (price.id)}
								{@const priceValue = Number(price.value)}
								<tr>
									<th>Price <small>({price.currency})</small></th>
									<td class="right">{formatCurrency(priceValue)} <small>{price.currency}</small></td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</ItemCard>
		{/each}
		{#if items.length === 0}
			<p>No items found for this shop.</p>
		{/if}
	</div>
</Section>
