<script lang="ts">
	import AdvancedNames from '$lib/components/widgets/names/AdvancedNames.svelte';
	import NameStats from '$lib/components/widgets/names/NameStats.svelte';
</script>

<svelte:head>
	<title>Names | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/names">Names</a>
</h1>

<NameStats lgCols={12} />

<div class="col-12">
	<AdvancedNames query={{}} limit={30} showDetails={true} />
</div>
