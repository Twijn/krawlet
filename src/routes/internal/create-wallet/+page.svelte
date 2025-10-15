<script lang="ts">
	import CreateWallet from '$lib/components/widgets/internal/CreateWallet.svelte';
</script>

<svelte:head>
	<title>Create Wallet | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	Internal <span>&raquo;</span>
	<a href="/internal/create-wallet">Create Wallet</a>
</h1>

<div class="col-12">
	<CreateWallet />
</div>

<style>
	div.col-12 {
		max-width: 480px;
	}
</style>
