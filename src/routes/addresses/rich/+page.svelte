<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import AdvancedAddresses from '$lib/components/widgets/addresses/AdvancedAddresses.svelte';
	import RichAddressStats from '$lib/components/widgets/addresses/RichAddressStats.svelte';
</script>

<svelte:head>
	<title>Richest Addresses | Krawlet</title>
</svelte:head>

<Breadcrumbs navItems={[
	{ label: 'Addresses', href: '/addresses' },
	{ label: 'Richest', href: '/addresses/rich' }
]} />

<RichAddressStats lgCols={12} />

<div class="col-12">
	<AdvancedAddresses limit={30} richest={true} showDetails={true} />
</div>
