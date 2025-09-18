<script lang="ts">
	import Section from "$lib/components/ui/Section.svelte";
	import settings from "$lib/stores/settings";
	import { faPaintBrush } from "@fortawesome/free-solid-svg-icons";
	import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
</script>

<svelte:head>
	<title>Settings | Krawlet</title>
</svelte:head>

<h1><a href="/">Krawlet</a> <span>&raquo;</span> <a href="/settings">Settings</a></h1>

<Section lgCols={12}>
	<h2><FontAwesomeIcon icon={faPaintBrush} /> Appearance</h2>
	
</Section>
