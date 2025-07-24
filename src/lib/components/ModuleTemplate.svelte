<script lang="ts">
	import Section from '$lib/components/Section.svelte';

	type ColumnCount = 1|2|3|4|5|6|7|8|9|10|11|12|null;

	const { lgCols = null, mdCols = null, smCols = null }: {
		lgCols?: ColumnCount,
		mdCols?: ColumnCount,
		smCols?: ColumnCount,
	} = $props();
</script>

<Section lgCols={lgCols} mdCols={mdCols} smCols={smCols}>
	<h2></h2>

</Section>
