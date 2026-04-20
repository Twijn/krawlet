<script lang="ts">
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import AddressComp from '$lib/components/widgets/addresses/Address.svelte';
	import Placeholder from '$lib/components/ui/Placeholder.svelte';
	import type { SortableColumnData } from '$lib/components/ui/SortableTable';
	import type { ContextMenuItem } from '$lib/components/ui/ContextMenu.svelte';
	import TableControls from '$lib/components/ui/TableControls.svelte';
	import LimitSelector from '$lib/components/ui/LimitSelector.svelte';
	import PaginationInfo from '$lib/components/ui/PaginationInfo.svelte';
	import { formatCurrency, relativeTime } from '$lib/util';
	import { paramState } from '$lib/paramState.svelte';
	import { AddressCache, type AddressCacheLookup } from '$lib/cache/AddressCache';
	import type { Address } from 'kromer';
	import {
		faCopy,
		faExchange,
		faEye,
		faPaperPlane,
		faTag
	} from '@fortawesome/free-solid-svg-icons';
	import { t$ } from '$lib/i18n';
	import { contextMenu } from '$lib/stores/contextMenu';
	import { notifications } from '$lib/stores/notifications';

	let {
		query = {},
		richest = false,
		showDetails = false,
		limit = $bindable(30),
		storePrefix = '',
		title
	}: {
		query?: Omit<AddressCacheLookup, 'addresses'>;
		richest?: boolean;
		showDetails?: boolean;
		limit: number;
		storePrefix?: string;
		title?: string;
	} = $props();

	const cache = new AddressCache();

	let page = paramState<number>(`${storePrefix.length > 0 ? storePrefix + '_' : ''}page`, 1, {
		serialize: (v) => v.toString(),
		deserialize: (s) => parseInt(s) || 1,
		shouldSet: (v) => v > 1
	});

	let offset = $derived((page.value - 1) * limit);

	let queryData: AddressCacheLookup = $derived({
		...query,
		limit,
		offset,
		richest
	});

	// svelte-ignore state_referenced_locally
	const addressQuery = cache.get(queryData);

	const refresh = () => {
		cache.update(queryData);
	};

	// Re-fetch when query parameters change (page, sort, etc.)
	$effect(() => {
		cache.update(queryData);
	});

	let loading: boolean = $derived($addressQuery?.loading ?? true);
	let addresses: Address[] = $derived($addressQuery?.data?.addresses ?? []);
	let total: number = $derived($addressQuery?.data?.total ?? 0);

	let columns: SortableColumnData<keyof Address>[] = $state([
		{ key: 'address', label: 'Address', align: 'right' },
		{ key: 'balance', label: 'Balance', align: 'right' },
		{ key: 'totalin', label: 'Total In', align: 'right' },
		{ key: 'totalout', label: 'Total Out', align: 'right' },
		{ key: 'firstseen', label: 'First Seen', align: 'right' }
	]);

	const handleAddressContextMenu = (event: MouseEvent, item: Address) => {
		if (event.defaultPrevented) return;
		event.preventDefault();

		const copyAddress = async () => {
			try {
				await navigator.clipboard.writeText(item.address);
				notifications.success(`Address '${item.address}' copied to clipboard.`);
			} catch (err) {
				console.error(err);
				notifications.error('Failed to copy address to clipboard.');
			}
		};

		const menuItems: ContextMenuItem[] = [
			{
				label: $t$('contextMenu.viewAddress'),
				icon: faEye,
				href: `/addresses/${item.address}`
			},
			{
				label: $t$('contextMenu.copyAddress'),
				icon: faCopy,
				action: copyAddress
			},
			{ separator: true, label: '' },
			{
				label: $t$('contextMenu.viewTransactions'),
				icon: faExchange,
				href: `/addresses/${item.address}/transactions`
			},
			{
				label: $t$('contextMenu.viewNames'),
				icon: faTag,
				href: `/addresses/${item.address}/names`
			},
			{ separator: true, label: '' },
			{
				label: $t$('contextMenu.sendKromer'),
				icon: faPaperPlane,
				href: `/transactions/new?to=${item.address}`
			}
		];

		contextMenu.show(event.clientX, event.clientY, menuItems);
	};
</script>

{#if !title}
	<TableControls {loading} bind:page={page.value} {limit} {total} onRefresh={refresh} />
{/if}

<SortableTable
	{refresh}
	{columns}
	data={addresses}
	{loading}
	{title}
	rowContextMenu={handleAddressContextMenu}
>
	{#snippet cell(item, column)}
		{#if column.key === 'address'}
			{@const address = item[column.key]}
			{#if address}
				<AddressComp {address} />
			{:else}
				<Placeholder />
			{/if}
		{:else if column.key === 'balance' || column.key === 'totalin' || column.key === 'totalout'}
			{@const value = item[column.key]}
			{#if value !== undefined}
				{formatCurrency(value)} <small>KRO</small>
			{:else}
				<Placeholder />
			{/if}
		{:else if column.key == 'firstseen'}
			{@const value = item[column.key]}
			{#if value && new Date(value).getTime() > 1_000_000}
				<small class="title-right" title={new Date(value).toLocaleString()}>
					{relativeTime(value)}
				</small>
			{:else}
				<Placeholder />
			{/if}
		{/if}
	{/snippet}
</SortableTable>
{#if $addressQuery?.error}
	<div class="error">Error: {$addressQuery.error.message}</div>
{/if}

<TableControls {loading} bind:page={page.value} {limit} {total} onRefresh={refresh}>
	{#if showDetails}
		<LimitSelector bind:limit />
	{/if}
	<PaginationInfo page={page.value} {limit} {total} itemName="address" itemNamePlural="addresses" />
</TableControls>

<style>
	.error {
		color: rgb(var(--red));
		margin-top: 1em;
	}
</style>
