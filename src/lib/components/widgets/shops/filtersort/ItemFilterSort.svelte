<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faFilter } from '@fortawesome/free-solid-svg-icons';
	import { DEFAULT_ITEM_SORT, type ItemSortOption } from '$lib/types/sort';
	import { t$ } from '$lib/i18n';

	let {
		searchQuery = $bindable(''),
		sortOption = $bindable(DEFAULT_ITEM_SORT)
	}: {
		searchQuery: string;
		sortOption: ItemSortOption;
	} = $props();
</script>

<Section lgCols={12}>
	<h2><FontAwesomeIcon icon={faFilter} />{$t$('shop.filterSort')}</h2>
	<div class="container">
		<input
			type="text"
			placeholder={$t$('shop.searchItems')}
			bind:value={searchQuery}
			class="col-9 col-sm-12"
		/>
		<select bind:value={sortOption} class="col-3 col-sm-12">
			<option value="name-asc">{$t$('shop.sortNameAsc')}</option>
			<option value="name-desc">{$t$('shop.sortNameDesc')}</option>
			<option value="id-asc">{$t$('shop.sortIdAsc')}</option>
			<option value="id-desc">{$t$('shop.sortIdDesc')}</option>
			<option value="price-asc">{$t$('shop.sortPriceAsc')}</option>
			<option value="price-desc">{$t$('shop.sortPriceDesc')}</option>
			<option value="stock-asc">{$t$('shop.sortStockAsc')}</option>
			<option value="stock-desc">{$t$('shop.sortStockDesc')}</option>
		</select>
	</div>
</Section>
