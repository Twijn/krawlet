<script lang="ts">
	import Transactions from '$lib/components/Transactions.svelte';
</script>

<svelte:head>
	<title>Transactions | Krawlet</title>
</svelte:head>

<h1><a href="/">Krawlet</a> <span>&raquo;</span> Transactions</h1>

<Transactions lgCols={12} limit={30} />
