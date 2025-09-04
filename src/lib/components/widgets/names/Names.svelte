<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { browser } from '$app/environment';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSign } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import AddressModule from '$lib/components/widgets/addresses/Address.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import kromer from '$lib/api/kromer';
	import type { NamesResponse } from 'kromer';
	import { relativeTime } from '$lib/util';
	import { paramState } from '$lib/paramState.svelte.js';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		limit = 100,
		address = null,
		queryPrefix = ''
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		limit?: number;
		address?: string | null;
		queryPrefix?: string;
	} = $props();

	let page = paramState(`${queryPrefix}page`, 1, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => value >= 2
	});

	let loading: boolean = $state(false);

	let namesPromise = $derived(
		browser
			? address
				? kromer.addresses.getNames(address, {
						offset: (page.value - 1) * limit,
						limit
					})
				: kromer.names.getAll({
						offset: (page.value - 1) * limit,
						limit
					})
			: null
	);

	let names: NamesResponse | null = $state(null);

	$effect(() => {
		loading = true;
		if (namesPromise) {
			namesPromise.then((result) => {
				names = result;
				loading = false;
			});
		}
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faSign} /> Names</h2>
	{#if names}
		{#if names.names.length === 0}
			<small class="none-found">
				No names found{address ? ` for address ${address}` : ''}!
			</small>
		{:else}
			<div class="table-container">
				<ModuleLoading absolute={true} bind:loading />
				{#if limit > 25}
					<Pagination bind:page={page.value} total={names.total} {limit} />
				{:else if address}
					<a id="view-all" href="/addresses/{address}/names">
						View all names for {address}
					</a>
				{:else}
					<a id="view-all" href="/names">View all names</a>
				{/if}
				<table>
					<thead>
						<tr>
							<th class="right">Name</th>
							<th>Owner</th>
							<th>Original Owner</th>
							<th>A</th>
							<th class="right">Transferred</th>
							<th class="right">Registered</th>
						</tr>
					</thead>
					<tbody>
						{#each names.names as name (name.name)}
							<tr>
								<td class="right"><code>{name.name}</code></td>
								<td>
									<AddressModule address={name.owner} />
								</td>
								<td>
									<AddressModule address={name.owner} />
								</td>
								<td>
									{#if name.a}
										{name.a}
									{:else}
										<small>No Data</small>
									{/if}
								</td>
								<td class="right">
									{#if name.transferred}
										{relativeTime(name.transferred)}
									{:else}
										<small>Never Transferred</small>
									{/if}
								</td>
								<td class="right" title={name.registered.toLocaleString()}>
									{relativeTime(name.registered)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<Pagination bind:page={page.value} total={names.total} {limit} />
			</div>
		{/if}
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

	code {
		display: inline-block;
		background-color: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.25em 0.5em;
		border-radius: 0.25em;
	}

	code::after {
		content: '.kro';
		opacity: 0.75;
	}

	.none-found {
		display: block;
		color: rgb(var(--red));
		text-align: center;
	}
</style>
