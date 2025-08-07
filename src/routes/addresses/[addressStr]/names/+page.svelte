<script lang="ts">
	import Names from '$lib/components/Names.svelte';

	const { data } = $props();
	const { address } = data;
</script>

<svelte:head>
	<title>Names | {address.address} | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/addresses">Addresses</a> <span>&raquo;</span>
	<a href="/addresses/{address.address}">{address.address}</a> <span>&raquo;</span>
	<a href="/addresses/{address.address}/names">Names</a>
</h1>

<Names address={address.address} limit={30} />
