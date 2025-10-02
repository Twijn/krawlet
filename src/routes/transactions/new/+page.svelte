<script lang="ts">
	import Send from '$lib/components/widgets/transactions/Send.svelte';
	import ItemPurchase from '$lib/components/widgets/transactions/ItemPurchase.svelte';
	import { paramState } from '$lib/paramState.svelte';

	const type = paramState<'transfer' | 'purchase'>('type', 'transfer', {
		shouldSet: (v) => ['purchase'].includes(v)
	});
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
	{#if type.value === 'transfer'}
		<Send />
	{:else if type.value === 'purchase'}
		<ItemPurchase />
	{/if}
</div>

<style>
	div {
		max-width: 50em;
	}
</style>
