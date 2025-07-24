<script lang="ts">
	import { onMount } from 'svelte';
	import type { MotdResponse } from '$lib/api/types/Motd';
	import Section from '$lib/components/Section.svelte';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import kromer from '$lib/api/kromer';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faMessage } from '@fortawesome/free-solid-svg-icons';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = null,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let motd: MotdResponse | null = $state(null);

	onMount(async () => {
		motd = await kromer.motd();
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faMessage} /> Message of the Day</h2>
	{#if motd}
		<p>{motd.motd}</p>
		<small>Last updated {motd.motd_set.toLocaleString()}</small>
	{:else}
		<ModuleLoading />
	{/if}
</Section>
