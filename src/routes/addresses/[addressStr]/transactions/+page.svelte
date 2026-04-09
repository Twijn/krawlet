<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import AdvancedTransactions from '$lib/components/widgets/transactions/AdvancedTransactions.svelte';

	const { data } = $props();
	const { address } = data;
</script>

<svelte:head>
	<title>Transactions | {address.address} | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Addresses', href: '/addresses' },
		{ label: address.address, href: `/addresses/${address.address}` },
		{ label: 'Transactions', href: `/addresses/${address.address}/transactions` }
	]}
/>

<div class="col-12">
	<AdvancedTransactions addresses={[address.address]} limit={30} showDetails={true} />
</div>
