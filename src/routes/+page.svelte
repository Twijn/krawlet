<script lang="ts">
	import Motd from '$lib/components/Motd.svelte';
	import Transactions from '$lib/components/Transactions.svelte';
	import QuickActions from '$lib/components/QuickActions.svelte';
	import Addresses from '$lib/components/Addresses.svelte';
	import Names from '$lib/components/Names.svelte';
</script>

<svelte:head>
	<title>Krawlet</title>
	<meta
		name="description"
		content="Krawlet: The simple, lightweight wallet for Kromer. Written in Svelte"
	/>
</svelte:head>

<h1><a href="/">Krawlet</a></h1>

<QuickActions lgCols={4} mdCols={12} />
<Transactions lgCols={8} mdCols={12} limit={5} queryPrefix="trans_" />

<Names lgCols={6} mdCols={12} limit={3} queryPrefix="name_" />
<Addresses lgCols={6} mdCols={12} limit={3} rich={true} queryPrefix="addr_" />

<Motd lgCols={12} />
