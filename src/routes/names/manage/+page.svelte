<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import ManageName from '$lib/components/widgets/names/ManageName.svelte';
</script>

<svelte:head>
	<title>Manage Names | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Names', href: '/names' },
		{ label: 'Manage', href: '/names/manage' }
	]}
/>

<ManageName />
