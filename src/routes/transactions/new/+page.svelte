<script lang="ts">
	import Send from '$lib/components/widgets/transactions/Send.svelte';
</script>

<svelte:head>
	<title>New Transaction | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/transactions">Transactions</a> <span>&raquo;</span>
	<a href="/transactions/new">New Transaction</a>
</h1>

<div class="col-12">
	<Send />
</div>

<style>
	div {
		max-width: 50em;
	}
</style>
