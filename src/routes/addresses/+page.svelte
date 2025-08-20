<script lang="ts">
	import Addresses from '$lib/components/widgets/addresses/Addresses.svelte';
</script>

<svelte:head>
	<title>Addresses | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/addresses">Addresses</a>
</h1>

<Addresses lgCols={12} limit={30} />
