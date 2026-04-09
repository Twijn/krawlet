<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import AdvancedAddresses from '$lib/components/widgets/addresses/AdvancedAddresses.svelte';
	import { faDollar } from '@fortawesome/free-solid-svg-icons';
</script>

<svelte:head>
	<title>Addresses | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[{ label: 'Addresses', href: '/addresses' }]}
	buttons={[
		{
			tk: 'address.viewRichest',
			icon: faDollar,
			href: '/addresses/rich'
		}
	]}
/>

<div class="col-12">
	<AdvancedAddresses limit={30} showDetails={true} />
</div>
