<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import CreateWallet from '$lib/components/widgets/internal/CreateWallet.svelte';
</script>

<svelte:head>
	<title>Create Wallet | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Internal', href: '/internal' },
		{ label: 'Create Wallet', href: '/internal/create-wallet' },
	]}
/>

<div class="col-12">
	<CreateWallet />
</div>

<style>
	div.col-12 {
		max-width: 480px;
	}
</style>
