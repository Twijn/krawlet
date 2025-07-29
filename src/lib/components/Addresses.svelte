<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import type { AddressesResponse } from '$lib/api/types/Address';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faAddressBook } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { relativeTime } from '$lib/util';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		limit = 100,
		rich = false
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		limit?: number;
		rich?: boolean;
	} = $props();

	let page: number = $state(1);

	let loading: boolean = $state(false);

	let addressesPromise = $derived(
		browser
			? kromer.addresses({
					rich,
					offset: (page - 1) * limit,
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
				<Pagination bind:page total={addresses.total} {limit} />
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
							<td><a href="/addresses/{address.address}">{address.address}</a></td>
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
			{#if limit > 25}
				<Pagination bind:page total={addresses.total} {limit} />
			{/if}
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
