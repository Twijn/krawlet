<script lang="ts">
	import { verified, type VerifiedEntry } from '$lib/verified';
	import Alert from '$lib/components/Alert.svelte';
	import kromer from '$lib/api/kromer';
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faFileSignature, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import { relativeTime } from '$lib/util';
	import type { Name } from '$lib/api/types/Name';
	import Transactions from '$lib/components/Transactions.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const { data } = $props();
	const address = $derived(data.address);

	let namesPromise = $derived(
		browser ?
			kromer.addressNames({
				address: address.address,
			}) : Promise.resolve(null)
	)

	let names: Name[] = $state([]);

	$effect(() => {
		namesPromise.then(result => {
			names = result?.names ?? [];
		});
	})

	onMount(async () => {
		const namesResponse = await kromer.addressNames({
			address: address.address,
		});

		if (namesResponse?.names) {
			names = namesResponse.names;
		}
	});

	const verifiedEntry: VerifiedEntry | null = $derived(verified[address.address] ?? null);
</script>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span> Address <span>&raquo;</span>
	<a href="/address/{address.address}">{address.address}</a>
</h1>

{#if verifiedEntry}
	<Alert variant="success">
		<strong>This address is verified!</strong>
		<p>
			{verifiedEntry.description}
		</p>
	</Alert>
{/if}

<Section lgCols={3} mdCols={6} smCols={12}>
	<h2><FontAwesomeIcon icon={faInfoCircle} /> Information</h2>
	{#if address}
		<div class="table-container">
			<table>
				<tbody>
				<tr>
					<th>Address</th>
					<td class="right">{address.address}</td>
				</tr>
				<tr>
					<th>Balance</th>
					<td class="right">{address.balance.toFixed(2)} <small>KRO</small></td>
				</tr>
				<tr>
					<th>Total In</th>
					<td class="right">{address.totalin.toFixed(2)} <small>KRO</small></td>
				</tr>
				<tr>
					<th>Total Out</th>
					<td class="right">{address.totalout.toFixed(2)} <small>KRO</small></td>
				</tr>
				<tr>
					<th>First Seen</th>
					<td class="right">{relativeTime(address.firstseen)}</td>
				</tr>
				</tbody>
			</table>
		</div>
	{:else}
		<ModuleLoading />
	{/if}
</Section>

<Section lgCols={3} mdCols={6} smCols={12}>
	<h2><FontAwesomeIcon icon={faFileSignature} /> Names</h2>
	{#if names.length > 0}
		<div class="table-container">
			<table>
				<thead>
				<tr>
					<th>Name</th>
					<th>Registered</th>
				</tr>
				</thead>
				<tbody>
				{#each names as name (name.name)}
					<tr>
						<td>{name.name}.kro</td>
						<td>{relativeTime(name.registered)}</td>
					</tr>
				{/each}
				</tbody>
			</table>
		</div>
	{:else if !address}
		<ModuleLoading />
	{:else}
		No names found!
	{/if}
</Section>

{#if address}
	<Transactions limit={6} address={address.address} lgCols={6} mdCols={12} />
{:else}
	<ModuleLoading />
{/if}

<div class="col-12">
	<Alert variant="info">
		Recent Transactions will show more pages than there are for this address. This is a bug with Kromer, not with Krawlet.
	</Alert>
</div>
