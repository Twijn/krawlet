<script lang="ts">
	import PurchaseName from '$lib/components/PurchaseName.svelte';
</script>

<svelte:head>
	<title>Purchase Name | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/names">Names</a> <span>&raquo;</span>
	<a href="/names/new">Purchase New Name</a>
</h1>

<div class="col-12">
	<div class="wrapper">
		<PurchaseName />
	</div>
</div>

<style>
	h1 {
		text-align: center;
	}

	.wrapper {
		max-width: 30em;
		margin: 0 auto;
	}
</style>
