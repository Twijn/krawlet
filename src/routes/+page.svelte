<script lang="ts">
	import Motd from '$lib/components/Motd.svelte';
	import Transactions from '$lib/components/Transactions.svelte';
	import Addresses from '$lib/components/Addresses.svelte';
	import Names from '$lib/components/Names.svelte';
	import Wallets from '$lib/components/Wallets.svelte';
</script>

<svelte:head>
	<title>Krawlet</title>
	<meta
		name="description"
		content="Krawlet: The simple, lightweight wallet for Kromer. Written in Svelte"
	/>
</svelte:head>

<h1><a href="/">Krawlet</a></h1>

<Wallets lgCols={5} mdCols={12} limit={4} />
<Transactions lgCols={7} mdCols={12} limit={5} queryPrefix="trans_" />

<Names lgCols={6} mdCols={12} limit={3} queryPrefix="name_" />
<Addresses lgCols={6} mdCols={12} limit={3} rich={true} queryPrefix="addr_" />

<Motd lgCols={12} />
