<script lang="ts">
	import Names from '$lib/components/Names.svelte';
</script>

<svelte:head>
	<title>Names | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/names">Names</a>
</h1>

<Names lgCols={12} limit={30} />
