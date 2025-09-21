<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';;
	import type { Shop, Listing } from '$lib/types/shops';
	import { formatCurrency } from '$lib/util';
	import { faListNumeric } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ItemCard from '$lib/components/widgets/shops/ItemCard.svelte';

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

	const items = $derived<Listing[]>(shop?.items ?? []);
</script>

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
