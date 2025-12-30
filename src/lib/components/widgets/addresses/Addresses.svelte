<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { browser } from '$app/environment';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faAddressBook } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { formatCurrency, relativeTime } from '$lib/util';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import kromer from '$lib/api/kromer';
	import type { AddressesResponse } from 'kromer';
	import { paramState } from '$lib/paramState.svelte.js';
	import { t$ } from '$lib/i18n';

	const SERVERWELF_ADDRESS = 'serverwelf';

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
				// Filter out serverwelf from rich list
				if (rich) {
					result.addresses = result.addresses.filter((addr) => addr.address !== SERVERWELF_ADDRESS);
				}
				addresses = result;
				loading = false;
			});
		}
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2>
		<FontAwesomeIcon icon={faAddressBook} />
		{rich ? $t$('nav.richestAddresses') : $t$('nav.addresses')}
	</h2>
	{#if addresses}
		{#if limit > 25}
			<Pagination bind:page={page.value} total={addresses.total} {limit} />
		{:else}
			<a id="view-all" href="/addresses{rich ? '/rich' : ''}"
				>{rich ? $t$('address.viewAllRich') : $t$('address.viewAll')}</a
			>
		{/if}
		<div class="table-container">
			<ModuleLoading absolute={true} bind:loading />
			<table>
				<thead>
					<tr>
						{#if rich}
							<th class="center">{$t$('address.rank')}</th>
						{/if}
						<th>{$t$('address.address')}</th>
						<th class="right">{$t$('address.balance')}</th>
						<th class="right">{$t$('address.totalIn')}</th>
						<th class="right">{$t$('address.totalOut')}</th>
						<th class="right">{$t$('address.firstSeen')}</th>
					</tr>
				</thead>
				<tbody>
					{#each addresses.addresses as address, i (address.address)}
						<tr>
							{#if rich}
								{@const rank = i + 1 + limit * (page.value - 1)}
								<td class="rank center" class:rank-gold={rank <= 5}>#{rank}</td>
							{/if}
							<td><Address address={address.address} /></td>
							<td class="right">{formatCurrency(address.balance)} <small>KRO</small></td>
							<td class="right">{formatCurrency(address.totalin)} <small>KRO</small></td>
							<td class="right">{formatCurrency(address.totalout)} <small>KRO</small></td>
							<td class="right" title={address.firstseen.toLocaleString()}
								>{relativeTime(address.firstseen)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<Pagination bind:page={page.value} total={addresses.total} {limit} />
	{:else}
		<ModuleLoading>
			<SkeletonTable rows={5} columns={rich ? 6 : 5} />
		</ModuleLoading>
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

	.rank {
		color: var(--text-color-2);
		font-weight: bold;
	}

	.rank-gold {
		color: #f4d939;
	}
</style>
