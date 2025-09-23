<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faFilter } from '@fortawesome/free-solid-svg-icons';

	let {
		searchQuery = $bindable(''),
		sortOption = $bindable('name-asc')
	}: {
		searchQuery: string;
		sortOption: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';
	} = $props();
</script>

<Section lgCols={12}>
	<h2><FontAwesomeIcon icon={faFilter} />Filter &amp; Sort</h2>
	<div class="container">
		<input
			type="text"
			placeholder="Search items..."
			bind:value={searchQuery}
			class="col-9 col-sm-12"
		/>
		<select bind:value={sortOption} class="col-3 col-sm-12">
			<option value="name-asc">Name (A-Z)</option>
			<option value="name-desc">Name (Z-A)</option>
			<option value="price-asc">Price (Low to High)</option>
			<option value="price-desc">Price (High to Low)</option>
		</select>
	</div>
</Section>
