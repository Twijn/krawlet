<script lang="ts">
	import Motd from '$lib/components/Motd.svelte';
	import Transactions from '$lib/components/Transactions.svelte';
	import QuickActions from '$lib/components/QuickActions.svelte';
	import Addresses from '$lib/components/Addresses.svelte';
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
<Transactions lgCols={8} mdCols={12} limit={5} />

<Addresses lgCols={6} limit={3} />
<Addresses lgCols={6} limit={3} rich={true} />

<Motd lgCols={12} />
