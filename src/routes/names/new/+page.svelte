<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import PurchaseName from '$lib/components/widgets/names/PurchaseName.svelte';
</script>

<svelte:head>
	<title>Purchase Name | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={
		[
			{ label: 'Names', href: '/names' },
			{ label: 'Purchase New Name', href: '/names/new' },
		]
	}
/>

<div class="col-12">
	<PurchaseName />
</div>

<style>
	div {
		max-width: 480px;
	}
</style>
