<script lang="ts">
	import type { TransactionWithMeta } from 'kromer';
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import Address from '../addresses/Address.svelte';
	import { formatCurrency, relativeTime } from '$lib/util';
	import Placeholder from '$lib/components/ui/Placeholder.svelte';
	import { t$ } from '$lib/i18n';
	import { contextMenu } from '$lib/stores/contextMenu';
	import { notifications } from '$lib/stores/notifications';
	import { refundModal } from '$lib/stores/refundModal';
	import settings from '$lib/stores/settings';
	import ParsedMetadata from '../transactions/ParsedMetadata.svelte';
	import type { SortableColumnData } from '$lib/components/ui/SortableTable';
	import type { ContextMenuItem } from '$lib/components/ui/ContextMenu.svelte';
	import { NameHistoryCache, type NameHistoryLookupQuery } from '$lib/cache';
	import TableControls from '$lib/components/ui/TableControls.svelte';
	import LimitSelector from '$lib/components/ui/LimitSelector.svelte';
	import PaginationInfo from '$lib/components/ui/PaginationInfo.svelte';
	import {
		faCopy,
		faEye,
		faMoneyBillTransfer,
		faPaperPlane
	} from '@fortawesome/free-solid-svg-icons';
	import { paramState } from '$lib/paramState.svelte';

	let {
		query,
		showDetails = false,
		limit = $bindable(30),
		title,
		storePrefix = ''
	}: {
		query: NameHistoryLookupQuery;
		showDetails?: boolean;
		limit: number;
		title?: string;
		storePrefix?: string;
	} = $props();

	const cache = new NameHistoryCache();

	const DEFAULT_SORT_COLUMN: keyof TransactionWithMeta = 'time';
	const DEFAULT_SORT_DIRECTION: 'ASC' | 'DESC' = 'DESC';

	const page = paramState<number>(`${storePrefix.length > 0 ? storePrefix + '_' : ''}page`, 1, {
		serialize: (v) => v.toString(),
		deserialize: (s) => parseInt(s) || 1,
		shouldSet: (v) => v > 1
	});

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

	let queryData: NameHistoryLookupQuery = $derived({
		orderBy: VALID_SORT_FIELDS.includes(sortedColumn.value as SortableField)
			? (sortedColumn.value as SortableField)
			: DEFAULT_SORT_COLUMN,
		order: sortDirection.value ?? DEFAULT_SORT_DIRECTION,
		...query,
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

{#if !title}
	<TableControls {loading} bind:page={page.value} {limit} {total} onRefresh={refresh} />
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
			<span
				class="type"
				class:type-welfare={item.type === 'mined'}
				class:type-transfer={item.type === 'transfer'}
				class:type-name-purchase={item.type === 'name_purchase'}
				class:type-name-a-record={item.type === 'name_a_record'}
				class:type-name-transfer={item.type === 'name_transfer'}
				>{item.type.replace(/_/g, ' ')}</span
			>
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

	.type-welfare {
		color: rgb(var(--green));
	}

	.type-transfer {
		color: rgb(var(--blue));
	}

	.type-name-purchase {
		color: rgb(var(--red));
	}

	.type-name-a-record {
		color: rgb(var(--red));
	}

	.type-name-transfer {
		color: rgb(var(--red));
	}

	.type {
		text-transform: capitalize;
		padding: 1em;
		border-radius: 0.25em;
		font-size: 0.9em;
		font-weight: 500;
	}
</style>
