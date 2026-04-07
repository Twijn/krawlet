<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import AdvancedTransactions from '$lib/components/widgets/transactions/AdvancedTransactions.svelte';
</script>

<svelte:head>
	<title>Transactions | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Transactions', href: '/transactions' },
	]}
/>

<div class="col col-12">
	<AdvancedTransactions limit={30} showDetails={true} />
</div>
