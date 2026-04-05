<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import AdvancedNames from '$lib/components/widgets/names/AdvancedNames.svelte';

	const { data } = $props();
	const { address } = data;
</script>

<svelte:head>
	<title>Names | {address.address} | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Addresses', href: '/addresses' },
		{ label: address.address, href: `/addresses/${address.address}` },
		{ label: 'Names', href: `/addresses/${address.address}/names` },
	]}
/>

<div class="col-12">
	<AdvancedNames limit={30} addresses={[address.address]} showDetails={true} />
</div>
