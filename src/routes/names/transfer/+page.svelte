<script lang="ts">
	import TransferName from '$lib/components/widgets/names/TransferName.svelte';
</script>

<svelte:head>
	<title>Transfer Name | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/names">Names</a> <span>&raquo;</span>
	<a href="/names/transfer">Transfer</a>
</h1>

<div class="col-12">
	<TransferName />
</div>

<style>
	div {
		max-width: 480px;
	}
</style>
