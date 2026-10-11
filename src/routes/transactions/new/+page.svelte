<script lang="ts">
	import Send from '$lib/components/widgets/transactions/Send.svelte';
	import ItemPurchase from '$lib/components/widgets/transactions/ItemPurchase.svelte';
	import { paramState } from '$lib/paramState.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';

	const type = paramState<'transfer' | 'purchase'>('type', 'transfer', {
		shouldSet: (v) => ['purchase'].includes(v)
	});
</script>

<svelte:head>
	<title>New Transaction | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Transactions', href: '/transactions' },
		{ label: 'New Transaction', href: '/transactions/new' }
	]}
/>

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
