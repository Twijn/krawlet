<script lang="ts">
	import type { TransactionLookupQuery, TransactionWithMeta } from 'kromer';
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import Address from '../addresses/Address.svelte';
	import { formatCurrency, relativeTime } from '$lib/util';
	import Placeholder from '$lib/components/ui/Placeholder.svelte';
	import { t$ } from '$lib/i18n';
	import { contextMenu } from '$lib/stores/contextMenu';
	import { notifications } from '$lib/stores/notifications';
	import { refundModal } from '$lib/stores/refundModal';
	import settings from '$lib/stores/settings';
	import ParsedMetadata from './ParsedMetadata.svelte';
	import type { SortableColumnData } from '$lib/components/ui/SortableTable';
	import type { ContextMenuItem } from '$lib/components/ui/ContextMenu.svelte';
	import { TransactionCache, type TransactionCacheLookup } from '$lib/cache';
	import TableControls from '$lib/components/ui/TableControls.svelte';
	import QueryBar from '$lib/components/ui/QueryBar.svelte';
	import LimitSelector from '$lib/components/ui/LimitSelector.svelte';
	import PaginationInfo from '$lib/components/ui/PaginationInfo.svelte';
	import AddressFilterModal from '$lib/components/dialogs/AddressFilterModal.svelte';
	import type { Filter } from '$lib/components/ui/QueryBar';
	import {
		faCheck,
		faCopy,
		faEye,
		faMoneyBillTransfer,
		faPaperPlane,
		faPlus
	} from '@fortawesome/free-solid-svg-icons';
	import { paramState } from '$lib/paramState.svelte';
	import TransactionType from './TransactionType.svelte';

	let {
		query = {},
		showDetails = false,
		addresses = $bindable([]),
		limit = $bindable(30),
		title,
		storePrefix = ''
	}: {
		query?: TransactionLookupQuery;
		showDetails?: boolean;
		addresses?: string[];
		limit: number;
		title?: string;
		storePrefix?: string;
	} = $props();

	const cache = new TransactionCache();

	const DEFAULT_SORT_COLUMN: keyof TransactionWithMeta = 'time';
	const DEFAULT_SORT_DIRECTION: 'ASC' | 'DESC' = 'DESC';

	const page = paramState<number>(`${storePrefix.length > 0 ? storePrefix + '_' : ''}page`, 1, {
		serialize: (v) => v.toString(),
		deserialize: (s) => parseInt(s) || 1,
		shouldSet: (v) => v > 1
	});

	const includeMined = paramState<boolean>(
		`${storePrefix.length > 0 ? storePrefix + '_' : ''}incl_welf`,
		false,
		{
			serialize: (v) => v.toString(),
			deserialize: (s) => s === 'true',
			shouldSet: (v) => v
		}
	);

	type SortableField = 'id' | 'from' | 'to' | 'value' | 'time';
	const VALID_SORT_FIELDS: SortableField[] = ['id', 'from', 'to', 'value', 'time'];
	const ALL_DISPLAY_FIELDS = ['id', 'type', 'from', 'to', 'value', 'metadata', 'time'] as const;

	let sortedColumn = paramState<keyof TransactionWithMeta>(
		`${storePrefix.length > 0 ? storePrefix + '_' : ''}sc`,
		DEFAULT_SORT_COLUMN,
		{
			serialize: (v) => v,
			deserialize: (s) =>
				ALL_DISPLAY_FIELDS.includes(s as SortableField)
					? (s as keyof TransactionWithMeta)
					: DEFAULT_SORT_COLUMN,
			shouldSet: (v) => ALL_DISPLAY_FIELDS.includes(v as SortableField) && v !== DEFAULT_SORT_COLUMN
		}
	);
	let sortDirection = paramState<'ASC' | 'DESC'>(
		`${storePrefix.length > 0 ? storePrefix + '_' : ''}sd`,
		DEFAULT_SORT_DIRECTION,
		{
			serialize: (v) => v,
			deserialize: (s) =>
				['ASC', 'DESC'].includes(s) ? (s as 'ASC' | 'DESC') : DEFAULT_SORT_DIRECTION,
			shouldSet: (v) => ['ASC', 'DESC'].includes(v) && v !== DEFAULT_SORT_DIRECTION
		}
	);
	let offset = $derived((page.value - 1) * limit);

	// Address filter modal state
	let showAddressModal = $state(false);

	// Internal address filters (with labels for display)
	type AddressFilter = { address: string; label?: string };
	let addressFilters = paramState<AddressFilter[]>(`${storePrefix.length > 0 ? storePrefix + '_' : ''}af`, [], {
		serialize: (filters) => filters.map((f) => `${f.address}:${f.label || ''}`).join(','),
		deserialize: (s) => {
			if (!s) return [];
			return s.split(',').map((part) => {
				const [address, label] = part.split(':');
				return { address, label: label || undefined };
			});
		},
		shouldSet: (filters) => Array.isArray(filters) && filters.length > 0
	});

	// Combine prop addresses with internal filters
	let allAddresses = $derived([...addresses, ...addressFilters.value.map((f) => f.address)]);

	// Convert to Filter[] for QueryBar (includes both prop addresses and internal filters)
	let filters: Filter[] = $derived([
		// Prop addresses (not removable)
		...addresses.map((addr, i) => ({
			id: `prop-address-${i}`,
			field: 'Address',
			value: addr,
			color: 'var(--blue)',
			removable: false
		})),
		// Internal address filters (removable)
		...addressFilters.value.map((f, i) => ({
			id: `address-${i}`,
			field: 'Address',
			value: f.label || f.address,
			color: 'var(--blue)'
		}))
	]);

	let queryData: TransactionCacheLookup = $derived({
		orderBy: VALID_SORT_FIELDS.includes(sortedColumn.value as SortableField)
			? (sortedColumn.value as SortableField)
			: DEFAULT_SORT_COLUMN,
		order: sortDirection.value ?? DEFAULT_SORT_DIRECTION,
		...query,
		includeMined: includeMined.value,
		addresses: allAddresses,
		limit,
		offset
	});

	// svelte-ignore state_referenced_locally
	const transactionQuery = cache.get(queryData);

	const refresh = () => {
		cache.update(queryData);
	};

	// Re-fetch when query parameters change (page, sort, etc.)
	$effect(() => {
		cache.update(queryData);
	});

	let loading: boolean = $derived($transactionQuery?.loading ?? true);
	let transactions: TransactionWithMeta[] = $derived($transactionQuery?.data?.transactions ?? []);
	let total: number = $derived($transactionQuery?.data?.total ?? 0);

	let columns: SortableColumnData<keyof TransactionWithMeta>[] = [
		{ key: 'id', label: 'ID', sortable: true },
		{ key: 'type', label: 'Type' },
		{ key: 'from', label: 'From', align: 'right', sortable: true },
		{ key: 'to', label: 'To', align: 'right', sortable: true },
		{ key: 'value', label: 'Value', align: 'right', sortable: true },
		{ key: 'metadata', label: 'Message' },
		{ key: 'time', label: 'Time', align: 'right', sortable: true }
	];

	const resetSort = () => {
		sortedColumn.value = 'time';
		sortDirection.value = 'DESC';
	};

	const handleAddAddress = (address: string, label?: string) => {
		// Don't add duplicates
		if (addressFilters.value.some((f) => f.address === address)) return;
		addressFilters.value = [...addressFilters.value, { address, label }];
		page.value = 1; // Reset to first page when filter changes
	};

	const handleRemoveFilter = (filter: Filter) => {
		// Only allow removing internal filters, not prop addresses
		if (!filter.id.startsWith('address-')) return;
		const index = parseInt(filter.id.replace('address-', ''));
		addressFilters.value = addressFilters.value.filter((_, i) => i !== index);
		page.value = 1; // Reset to first page when filter changes
	};

	const toggleIncludeMined = () => {
		includeMined.value = !includeMined.value;
		page.value = 1;
	};

	const handleTransactionContextMenu = (event: MouseEvent, transaction: TransactionWithMeta) => {
		if (event.defaultPrevented) return;
		event.preventDefault();

		const copyTransactionId = async () => {
			try {
				await navigator.clipboard.writeText(transaction.id.toString());
				notifications.success(`Transaction ID '${transaction.id}' copied to clipboard.`);
			} catch (err) {
				console.error(err);
				notifications.error('Failed to copy transaction ID to clipboard.');
			}
		};

		const menuItems: ContextMenuItem[] = [
			{
				label: $t$('contextMenu.viewTransaction'),
				icon: faEye,
				href: `/transactions/${transaction.id}`
			},
			{
				label: $t$('contextMenu.copyTransactionId'),
				icon: faCopy,
				action: copyTransactionId
			}
		];

		const ownsToAddress =
			transaction.to && $settings.wallets.some((wallet) => wallet.address === transaction.to);

		if (ownsToAddress) {
			menuItems.push(
				{ separator: true, label: '' },
				{
					label: $t$('contextMenu.refundTransaction'),
					icon: faMoneyBillTransfer,
					action: () => refundModal.open(transaction)
				}
			);
		}

		if (transaction.to) {
			menuItems.push(
				{ separator: true, label: '' },
				{
					label: $t$('contextMenu.sendToRecipient'),
					icon: faPaperPlane,
					href: `/transactions/new?to=${transaction.to}`
				}
			);
		}

		if (transaction.from) {
			if (!transaction.to) {
				menuItems.push({ separator: true, label: '' });
			}
			menuItems.push({
				label: $t$('contextMenu.sendToSender'),
				icon: faPaperPlane,
				href: `/transactions/new?to=${transaction.from}`
			});
		}

		contextMenu.show(event.clientX, event.clientY, menuItems);
	};
</script>

<AddressFilterModal
	bind:open={showAddressModal}
	onClose={() => (showAddressModal = false)}
	onSelect={handleAddAddress}
	selectedAddresses={allAddresses}
/>

{#if !title}
	<TableControls {loading} bind:page={page.value} {limit} {total} onRefresh={refresh}>
		{#if showDetails}
			<QueryBar
				bind:sortedColumn={sortedColumn.value}
				sortDirection={sortDirection.value}
				defaultSortColumn="time"
				defaultSortDirection="DESC"
				{columns}
				onSortReset={resetSort}
				{filters}
				onFilterRemove={handleRemoveFilter}
				filterButtons={[
					{
						tk: 'transaction.addAddressFilter',
						type: 'button',
						variant: 'primary',
						icon: faPlus,
						size: 'small',
						onClick: () => (showAddressModal = true)
					},
					{
						tk: 'transaction.includeWelfare',
						type: 'button',
						variant: includeMined.value ? 'success' : 'secondary',
						icon: includeMined.value ? faCheck : faMoneyBillTransfer,
						size: 'small',
						onClick: toggleIncludeMined
					}
				]}
			/>
		{/if}
	</TableControls>
{/if}

<SortableTable
	{refresh}
	{columns}
	data={transactions}
	{loading}
	{title}
	rowContextMenu={handleTransactionContextMenu}
	bind:sortedColumn={sortedColumn.value}
	bind:sortDirection={sortDirection.value}
>
	{#snippet cell(item, column)}
		{#if column.key === 'from' || column.key === 'to'}
			{@const address = item[column.key]}
			{#if address}
				<Address {address} />
			{:else}
				<Placeholder text={$t$('transaction.noMetadata')} />
			{/if}
		{:else if column.key === 'type'}
			<TransactionType tx={item} />
		{:else if column.key === 'value'}
			{formatCurrency(item.value)}
			<small>KRO</small>
		{:else if column.key === 'time'}
			<small class="title-right" title={item.time.toLocaleString()}>
				{relativeTime(item.time)}
			</small>
		{:else if column.key === 'metadata'}
			{#if item.metadata}
				<div class="metadata">
					<ParsedMetadata transaction={item} />
				</div>
			{:else}
				<Placeholder text={$t$('transaction.noMetadata')} />
			{/if}
		{:else if column.key === 'id'}
			<a
				class="monospace title-left"
				href="/transactions/{item.id}"
				title="View transaction #{item.id}">{item.id}</a
			>
		{/if}
	{/snippet}
</SortableTable>
{#if $transactionQuery?.error}
	<div class="error">Error: {$transactionQuery.error.message}</div>
{/if}

<TableControls {loading} bind:page={page.value} {limit} {total} onRefresh={refresh}>
	{#if showDetails}
		<LimitSelector bind:limit />
	{/if}
	<PaginationInfo
		page={page.value}
		{limit}
		{total}
		itemName="transaction"
		itemNamePlural="transactions"
	/>
</TableControls>

<style>
	.metadata {
		max-width: 26em;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.monospace {
		font-family: monospace;
	}

	.error {
		color: rgb(var(--red));
		margin-top: 1em;
	}
</style>
