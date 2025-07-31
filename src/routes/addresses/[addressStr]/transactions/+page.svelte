<script lang="ts">
	import Transactions from '$lib/components/Transactions.svelte';

	const { data } = $props();
	const { address } = data;
</script>

<svelte:head>
	<title>Transactions | {address.address} | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/addresses">Addresses</a> <span>&raquo;</span>
	<a href="/addresses/{address.address}">{address.address}</a> <span>&raquo;</span>
	<a href="/addresses/{address.address}/transactions">Transactions</a>
</h1>

<Transactions address={address.address} limit={30} />
