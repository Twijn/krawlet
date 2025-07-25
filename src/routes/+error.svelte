<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import Button from '$lib/components/Button.svelte';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a>
</h1>
<Section lgCols={12}>
	<h2>{page.status}: {page?.error?.message ?? 'Internal Server Error'}</h2>
	<p>
		The page responded with a status of {page.status}.
	</p>
	<div class="links">
		<Button variant="primary" href="/" full={true}>Return to Home</Button>
	</div>
</Section>
