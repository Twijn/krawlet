<script lang="ts">
	import Motd from '$lib/components/Motd.svelte';
	import Send from '$lib/components/Send.svelte';
	import Transactions from '$lib/components/Transactions.svelte';
</script>

<svelte:head>
	<title>Krawlet</title>
</svelte:head>

<h1><a href="/">Krawlet</a></h1>

<Send lgCols={5} mdCols={12} />
<Transactions lgCols={7} mdCols={12} limit={5} />

<Motd lgCols={12} />
