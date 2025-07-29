<script lang="ts">
	import Addresses from '$lib/components/Addresses.svelte';
</script>

<svelte:head>
	<title>Richest Addresses | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/addresses">Addresses</a> <span>&raquo;</span>
	<a href="/addresses/rich">Richest</a>
</h1>

<Addresses lgCols={12} limit={30} rich={true} />
