<script lang="ts">
	import GiveMoney from '$lib/components/widgets/internal/GiveMoney.svelte';
</script>

<svelte:head>
	<title>Give Money | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	Internal <span>&raquo;</span>
	<a href="/internal/give-money">Give Money</a>
</h1>

<div class="col-12">
	<GiveMoney />
</div>

<style>
    div.col-12 {
        max-width: 480px;
    }
</style>
