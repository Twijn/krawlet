<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import GiveMoney from '$lib/components/widgets/internal/GiveMoney.svelte';
</script>

<svelte:head>
	<title>Give Money | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Home', href: '/' },
		{ label: 'Internal', href: '/internal' },
		{ label: 'Give Money', href: '/internal/give-money' },
	]}
/>

<div class="col-12">
	<GiveMoney />
</div>

<style>
	div.col-12 {
		max-width: 480px;
	}
</style>
