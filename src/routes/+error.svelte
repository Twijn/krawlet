<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { page } from '$app/state';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
</script>

<svelte:head>
	<title>{page.status} | Krawlet</title>
</svelte:head>

<Breadcrumbs />

<Section lgCols={12}>
	<h2>{page.status}: {page?.error?.message ?? 'Internal Server Error'}</h2>
	<p>
		The page responded with a status of {page.status}.
	</p>
	<div class="links">
		<Button variant="primary" href="/" full={true}>Return to Home</Button>
	</div>
</Section>
