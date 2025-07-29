<script lang="ts">
	import Send from '$lib/components/Send.svelte';
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
	<div class="wrapper">
		<Send />
	</div>
</div>

<style>
	h1 {
		text-align: center;
	}

	.wrapper {
		max-width: 30em;
		margin: 0 auto;
	}
</style>
