<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faFilter } from '@fortawesome/free-solid-svg-icons';
	import { DEFAULT_SHOP_SORT, type ShopSortOption } from '$lib/types/sort';

	let {
		searchQuery = $bindable(''),
		sortOption = $bindable(DEFAULT_SHOP_SORT)
	}: {
		searchQuery: string;
		sortOption: ShopSortOption;
	} = $props();
</script>

<Section lgCols={12}>
	<h2><FontAwesomeIcon icon={faFilter} />Filter &amp; Sort</h2>
	<div class="container">
		<input
			type="text"
			placeholder="Search shops..."
			bind:value={searchQuery}
			class="col-9 col-sm-12"
		/>
		<select bind:value={sortOption} class="col-3 col-sm-12">
			<option value="name-asc">Name (A-Z)</option>
			<option value="name-desc">Name (Z-A)</option>
			<option value="owner-asc">Owner (A-Z)</option>
			<option value="owner-desc">Owner (Z-A)</option>
			<option value="updated-asc">Last Updated (Oldest)</option>
			<option value="updated-desc">Last Updated (Newest)</option>
			<option value="created-asc">Created (Oldest)</option>
			<option value="created-desc">Created (Newest)</option>
		</select>
	</div>
</Section>
