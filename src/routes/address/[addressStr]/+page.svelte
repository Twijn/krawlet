<script lang="ts">
	import { verified, type VerifiedEntry } from '$lib/verified';
	import Alert from '$lib/components/Alert.svelte';
	import type { Address } from '$lib/api/types/Address';
	import { onMount } from 'svelte';
	import kromer from '$lib/api/kromer';
	import Section from '$lib/components/Section.svelte';

	const { params } = $props();
	const { addressStr } = params;

	let address: Address|null = $state(null);

	onMount(async () => {
		address = await kromer.address({ address: addressStr });
	});

	const verifiedEntry: VerifiedEntry|null = verified[addressStr] ?? null;
</script>

<h1><a href="/">Krawlet</a> <span>&raquo;</span> Address <span>&raquo;</span> <a href="/address/{addressStr}">{addressStr}</a></h1>

{#if verifiedEntry}
	<Alert variant="success">
		<strong>This address is verified!</strong>
		<p>
			{verifiedEntry.description}
		</p>
	</Alert>
{/if}

<Section lgCols={3}>
	<p>soon &trade;</p>
	{#if address}
		<p>until that comes, this person has {address.balance.toFixed(2)} KRO</p>
	{/if}
</Section>
