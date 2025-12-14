<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faFilter } from '@fortawesome/free-solid-svg-icons';
	import { DEFAULT_SHOP_SORT, type ShopSortOption } from '$lib/types/sort';
	import { t$ } from '$lib/i18n';

	let {
		searchQuery = $bindable(''),
		sortOption = $bindable(DEFAULT_SHOP_SORT)
	}: {
		searchQuery: string;
		sortOption: ShopSortOption;
	} = $props();
</script>

<Section lgCols={12}>
	<h2><FontAwesomeIcon icon={faFilter} />{$t$('shop.filterSort')}</h2>
	<div class="container">
		<input
			type="text"
			placeholder={$t$('shop.searchShops')}
			bind:value={searchQuery}
			class="col-9 col-sm-12"
		/>
		<select bind:value={sortOption} class="col-3 col-sm-12">
			<option value="name-asc">{$t$('shop.sortNameAsc')}</option>
			<option value="name-desc">{$t$('shop.sortNameDesc')}</option>
			<option value="owner-asc">{$t$('shop.sortOwnerAsc')}</option>
			<option value="owner-desc">{$t$('shop.sortOwnerDesc')}</option>
			<option value="updated-asc">{$t$('shop.sortUpdatedAsc')}</option>
			<option value="updated-desc">{$t$('shop.sortUpdatedDesc')}</option>
			<option value="created-asc">{$t$('shop.sortCreatedAsc')}</option>
			<option value="created-desc">{$t$('shop.sortCreatedDesc')}</option>
		</select>
	</div>
</Section>
