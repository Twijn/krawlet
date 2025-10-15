<script lang="ts">
	import TransferName from '$lib/components/widgets/names/TransferName.svelte';
	import PurchaseName from '$lib/components/widgets/names/PurchaseName.svelte';
	import UpdateName from '$lib/components/widgets/names/UpdateName.svelte';
</script>

<svelte:head>
	<title>Manage Names | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/names">Names</a> <span>&raquo;</span>
	<a href="/names/manage">Manage</a>
</h1>

<PurchaseName lgCols={6} mdCols={12} />
<TransferName lgCols={6} mdCols={12} />
<UpdateName lgCols={6} mdCols={12} />
