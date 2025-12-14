<script lang="ts">
	import Transactions from '$lib/components/widgets/transactions/Transactions.svelte';
	import TransactionStats from '$lib/components/widgets/transactions/TransactionStats.svelte';
</script>

<svelte:head>
	<title>Transactions | Krawlet</title>
</svelte:head>

<h1><a href="/">Krawlet</a> <span>&raquo;</span> Transactions</h1>

<TransactionStats lgCols={12} />

<Transactions lgCols={12} limit={30} />
