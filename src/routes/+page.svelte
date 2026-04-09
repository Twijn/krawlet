<script lang="ts">
	import CompactWallets from '$lib/components/widgets/wallets/CompactWallets.svelte';
	import AdvancedNames from '$lib/components/widgets/names/AdvancedNames.svelte';
	import AdvancedTransactions from '$lib/components/widgets/transactions/AdvancedTransactions.svelte';
	import AdvancedAddresses from '$lib/components/widgets/addresses/AdvancedAddresses.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
</script>

<svelte:head>
	<title>Krawlet</title>
	<meta
		name="description"
		content="Krawlet: The simple, lightweight wallet for Kromer. Written in Svelte"
	/>
</svelte:head>

<Breadcrumbs />

<CompactWallets lgCols={5} mdCols={12} limit={8} showAddButton={true} compact={true} />
<div class="col-7 col-md-12">
	<AdvancedTransactions storePrefix="tx" title="Recent Transactions" limit={10} query={{}} />
</div>

<div class="col-6 col-md-12">
	<AdvancedNames storePrefix="nm" title="Recent Names" limit={5} query={{}} />
</div>
<div class="col-6 col-md-12">
	<AdvancedAddresses storePrefix="ad" title="Top Addresses" limit={5} richest={true} />
</div>
