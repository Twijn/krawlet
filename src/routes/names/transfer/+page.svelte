<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import TransferName from '$lib/components/widgets/names/TransferName.svelte';
</script>

<svelte:head>
	<title>Transfer Name | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Names', href: '/names' },
		{ label: 'Transfer', href: '/names/transfer' },
	]}
/>

<div class="col-12">
	<TransferName />
</div>

<style>
	div {
		max-width: 480px;
	}
</style>
