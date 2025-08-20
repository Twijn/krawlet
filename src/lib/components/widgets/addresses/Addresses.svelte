<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { browser } from '$app/environment';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faAddressBook } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { relativeTime } from '$lib/util';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import kromer from '$lib/api/kromer';
	import type { AddressesResponse } from 'kromer';
	import { paramState } from '$lib/paramState.svelte.js';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		limit = 100,
		rich = false,
		queryPrefix = ''
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		limit?: number;
		rich?: boolean;
		queryPrefix?: string;
	} = $props();

	let page = paramState(`${queryPrefix}page`, 1, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => value >= 2
	});

	let loading: boolean = $state(false);

	let addressesPromise = $derived(
		browser
			? kromer.addresses[rich ? 'getRich' : 'getAll']({
					offset: (page.value - 1) * limit,
					limit
				})
			: null
	);

	let addresses: AddressesResponse | null = $state(null);

	$effect(() => {
		loading = true;
		if (addressesPromise) {
			addressesPromise.then((result) => {
				addresses = result;
				loading = false;
			});
		}
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faAddressBook} /> {rich ? 'Richest ' : ''}Addresses</h2>
	{#if addresses}
		<div class="table-container">
			<ModuleLoading absolute={true} bind:loading />
			{#if limit > 25}
				<Pagination bind:page={page.value} total={addresses.total} {limit} />
			{:else}
				<a id="view-all" href="/addresses{rich ? '/rich' : ''}"
					>View all {rich ? 'of the richest' : ''} addresses</a
				>
			{/if}
			<table>
				<thead>
					<tr>
						<th>Address</th>
						<th class="right">Balance</th>
						<th class="right">Total In</th>
						<th class="right">Total Out</th>
						<th class="right">First Seen</th>
					</tr>
				</thead>
				<tbody>
					{#each addresses.addresses as address (address.address)}
						<tr>
							<td><Address address={address.address} /></td>
							<td class="right">{address.balance.toFixed(2)} <small>KRO</small></td>
							<td class="right">{address.totalin.toFixed(2)} <small>KRO</small></td>
							<td class="right">{address.totalout.toFixed(2)} <small>KRO</small></td>
							<td class="right" title={address.firstseen.toLocaleString()}
								>{relativeTime(address.firstseen)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
			<Pagination bind:page={page.value} total={addresses.total} {limit} />
		</div>
	{:else}
		<ModuleLoading />
	{/if}
</Section>

<style>
	#view-all {
		display: block;
		text-align: center;
		font-size: 0.8em;
		color: var(--text-color-2);
		margin: 1em 0;
	}
</style>
