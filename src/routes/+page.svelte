<script lang="ts">
	import Motd from '$lib/components/widgets/Motd.svelte';
	import Addresses from '$lib/components/widgets/addresses/Addresses.svelte';
	import Wallets from '$lib/components/widgets/Wallets.svelte';
	import AdvancedNames from '$lib/components/widgets/names/AdvancedNames.svelte';
	import AdvancedTransactions from '$lib/components/widgets/transactions/AdvancedTransactions.svelte';
</script>

<svelte:head>
	<title>Krawlet</title>
	<meta
		name="description"
		content="Krawlet: The simple, lightweight wallet for Kromer. Written in Svelte"
	/>
</svelte:head>

<h1><a href="/">Krawlet</a></h1>

<Wallets lgCols={5} mdCols={12} limit={8} showAddButton={true} compact={true} />
<div class="col-7 col-md-12">
	<AdvancedTransactions limit={10} query={{}} />
</div>

<div class="col-6 col-md-12">
	<AdvancedNames limit={5} query={{}} />
</div>
<Addresses lgCols={6} mdCols={12} limit={3} rich={true} queryPrefix="addr_" />

<Motd lgCols={12} />
