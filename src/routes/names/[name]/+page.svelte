<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import NameTransactions from '$lib/components/widgets/names/NameTransactions.svelte';

	const { data } = $props();
	const name = $derived(data.name);
</script>

<svelte:head>
	<title>{name.name} | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Names', href: '/names' },
		{ label: name.name + '.kro', href: `/names/${name.name}` }
	]}
/>

<div class="col-12">
	<NameTransactions
		title="Name History"
		query={{ name: name.name, type: 'history' }}
		limit={15}
		storePrefix="hs"
	/>
	<NameTransactions
		title="Name Transactions"
		query={{ name: name.name, type: 'transactions' }}
		limit={15}
		storePrefix="tx"
	/>
</div>
