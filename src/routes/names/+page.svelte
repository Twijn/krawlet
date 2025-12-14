<script lang="ts">
	import Names from '$lib/components/widgets/names/Names.svelte';
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

<Names lgCols={12} limit={30} />
