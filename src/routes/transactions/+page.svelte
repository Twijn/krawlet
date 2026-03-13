<script lang="ts">
	import AdvancedTransactions from '$lib/components/widgets/transactions/AdvancedTransactions.svelte';
</script>

<svelte:head>
	<title>Transactions | Krawlet</title>
</svelte:head>

<h1><a href="/">Krawlet</a> <span>&raquo;</span> Transactions</h1>

<div class="col col-12">
	<AdvancedTransactions limit={30} query={{}} showDetails={true} />
</div>
