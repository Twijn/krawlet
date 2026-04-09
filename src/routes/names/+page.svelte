<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import AdvancedNames from '$lib/components/widgets/names/AdvancedNames.svelte';
	import NameStats from '$lib/components/widgets/names/NameStats.svelte';
</script>

<svelte:head>
	<title>Names | Krawlet</title>
</svelte:head>

<Breadcrumbs navItems={[{ label: 'Names', href: '/names' }]} />

<NameStats lgCols={12} />

<div class="col-12">
	<AdvancedNames query={{}} limit={30} showDetails={true} />
</div>
