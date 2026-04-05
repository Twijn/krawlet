<script lang="ts">
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
</script>

<svelte:head>
	<title>Not Yet Implemented | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Names', href: '/names' },
		{ label: 'Not Yet Implemented', href: '/names/' },
	]}
/>

<Alert variant="danger">
	<strong>This isn't implemented yet!</strong>
	<p>
		Kromer doesn't allow most lookup queries, severely limiting the capabilities that a dedicated
		Name page would have.
	</p>
	<p>
		Until Kromer expands a little bit on this front, you will not be able to view a full page based
		on a Kromer name.
	</p>
</Alert>
