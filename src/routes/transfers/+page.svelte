<script lang="ts">
	import type { PageData } from './$types';
	import { getMinecraftAvatar, relativeTime } from '$lib/util';
	import LiveContentsModal from '$lib/components/dialogs/LiveContentsModal.svelte';
	import StartTransferModal from '$lib/components/dialogs/StartTransferModal.svelte';
	import TransferProgressModal from '$lib/components/dialogs/TransferProgressModal.svelte';
	import type { BreadcrumbButton } from '$lib/components/ui/Breadcrumbs';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import type { SortableColumnData } from '$lib/components/ui/SortableTable';
	import { faBellConcierge, faBoxArchive, faPlus } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	const { data }: { data: PageData } = $props();
	const transferList = $derived(data.transfers ?? []);

	type RouteTransfer = PageData['transfers'][number];

	type TransferColumn =
		| 'itemName'
		| 'fromName'
		| 'toName'
		| 'quantityTransferred'
		| 'quantity'
		| 'status'
		| 'timestamp'
		| 'actions';

	const columns: SortableColumnData<TransferColumn>[] = [
		{ key: 'itemName', label: 'Item', sortable: true },
		{ key: 'fromName', label: 'From', sortable: true },
		{ key: 'toName', label: 'To', sortable: true },
		{ key: 'quantityTransferred', label: 'Moved', align: 'right', sortable: true },
		{ key: 'quantity', label: 'Requested', align: 'right', sortable: true },
		{ key: 'status', label: 'Status', sortable: true },
		{ key: 'timestamp', label: 'Updated', align: 'right', sortable: true },
		{ key: 'actions', label: 'Actions', align: 'right', sortable: false }
	];

	let sortedColumn = $state<TransferColumn>('timestamp');
	let sortDirection = $state<'ASC' | 'DESC'>('DESC');

	let showProgressModal = $state(false);
	let showStartTransferModal = $state(false);
	let showLiveContentsModal = $state(false);
	let selectedTransferId = $state('');

	function openProgressModal(transferId: string) {
		selectedTransferId = transferId;
		showProgressModal = true;
	}

	function handleTransferCreated(transferId: string) {
		openProgressModal(transferId);
	}

	function getTransferImageUrl(itemName: string | null | undefined): string {
		const safeItemName = itemName ?? 'minecraft:barrier';
		return `https://cdn.krawlet.cc/${safeItemName.replace(':', '/')}.png`;
	}

	function isMinecraftUuid(value: string | null | undefined): boolean {
		return (
			typeof value === 'string' &&
			/^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i.test(value)
		);
	}

	function isMinecraftName(value: string | null | undefined): boolean {
		return typeof value === 'string' && /^[A-Za-z0-9_]{3,16}$/.test(value);
	}

	function formatPlayerLabel(
		name: string | null | undefined,
		uuid: string | null | undefined
	): string {
		const safeName = typeof name === 'string' ? name.trim() : '';
		const safeUuid = typeof uuid === 'string' ? uuid.trim() : '';

		if (isMinecraftName(safeName)) return safeName;
		if (safeName.length > 0) return safeName;
		if (isMinecraftUuid(safeUuid)) return safeUuid;
		if (safeUuid.length > 0) return safeUuid;
		return 'Unknown';
	}

	function compareTransfers(a: RouteTransfer, b: RouteTransfer): number {
		if (!sortedColumn) return 0;

		if (sortedColumn === 'itemName') {
			const aValue = a.itemName ?? '';
			const bValue = b.itemName ?? '';
			return sortDirection === 'ASC' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
		}

		if (sortedColumn === 'fromName' || sortedColumn === 'toName') {
			const aValue = (a[sortedColumn] ?? '') as string;
			const bValue = (b[sortedColumn] ?? '') as string;
			return sortDirection === 'ASC' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
		}

		if (sortedColumn === 'status') {
			const aValue = a.status;
			const bValue = b.status;
			return sortDirection === 'ASC' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
		}

		if (sortedColumn === 'timestamp') {
			const aValue = new Date(a.timestamp).getTime();
			const bValue = new Date(b.timestamp).getTime();
			return sortDirection === 'ASC' ? aValue - bValue : bValue - aValue;
		}

		if (sortedColumn === 'quantity' || sortedColumn === 'quantityTransferred') {
			const aValue = (a[sortedColumn] ?? 0) as number;
			const bValue = (b[sortedColumn] ?? 0) as number;
			return sortDirection === 'ASC' ? aValue - bValue : bValue - aValue;
		}

		return 0;
	}

	function getSortedTransfers(transferList: RouteTransfer[]): RouteTransfer[] {
		return transferList.slice().sort(compareTransfers);
	}

	function refresh() {
		// Sorting is local for now; no API refresh needed when clicking headers.
	}

	const breadcrumbButtons: BreadcrumbButton[] = [
		{
			label: 'Live Contents',
			icon: faBoxArchive,
			onClick: () => (showLiveContentsModal = true)
		},
		{
			label: 'Start Transfer',
			icon: faPlus,
			variant: 'primary',
			onClick: () => (showStartTransferModal = true)
		}
	];
</script>

<svelte:head>
	<title>Transfers | Krawlet</title>
</svelte:head>

<Breadcrumbs navItems={[{ label: 'Transfers', href: '/transfers' }]} buttons={breadcrumbButtons} />

<div class="col-12">
	{#if data.transfersError}
		<p class="error">Error loading transfers: {data.transfersError}</p>
	{:else if transferList.length === 0}
		<p class="muted">No active transfers.</p>
	{:else}
		<SortableTable
			bind:sortedColumn
			bind:sortDirection
			{columns}
			{refresh}
			data={getSortedTransfers(transferList)}
		>
			{#snippet cell(item, column)}
				{#if column.key === 'itemName'}
					<div class="item-cell">
						<img
							src={getTransferImageUrl(item.itemName)}
							alt={item.itemName ?? 'Unknown item'}
							class="item-image"
							loading="lazy"
						/>
						<span class="item-name">{item.itemName ?? 'Unknown item'}</span>
					</div>
				{:else if column.key === 'quantityTransferred'}
					{(item.quantityTransferred ?? 0).toLocaleString()}
				{:else if column.key === 'fromName'}
					<div class="party-cell">
						{#if isMinecraftName(item.fromName) && isMinecraftUuid(item.fromUUID)}
							<img
								class="player-avatar"
								src={getMinecraftAvatar(item.fromUUID ?? '', 32)}
								alt="Avatar for {item.fromName}"
								loading="lazy"
							/>
						{/if}
						<div class="party-text">
							<span class="party">{formatPlayerLabel(item.fromName, item.fromUUID)}</span>
							{#if isMinecraftUuid(item.fromUUID)}
								<small class="uuid">{item.fromUUID}</small>
							{/if}
						</div>
					</div>
				{:else if column.key === 'toName'}
					<div class="party-cell">
						{#if isMinecraftName(item.toName) && isMinecraftUuid(item.toUUID)}
							<img
								class="player-avatar"
								src={getMinecraftAvatar(item.toUUID ?? '', 32)}
								alt="Avatar for {item.toName}"
								loading="lazy"
							/>
						{/if}
						<div class="party-text">
							<span class="party">{formatPlayerLabel(item.toName, item.toUUID)}</span>
							{#if isMinecraftUuid(item.toUUID)}
								<small class="uuid">{item.toUUID}</small>
							{/if}
						</div>
					</div>
				{:else if column.key === 'quantity'}
					{(item.quantity ?? 0).toLocaleString()}
				{:else if column.key === 'status'}
					<span class="transfer-status {item.status}">{item.status.replaceAll('_', ' ')}</span>
				{:else if column.key === 'timestamp'}
					<small class="title-right" title={new Date(item.timestamp).toLocaleString()}>
						{relativeTime(new Date(item.timestamp))}
					</small>
				{:else if column.key === 'actions'}
					<Button variant="secondary" onClick={() => openProgressModal(item.id)}>
						<FontAwesomeIcon icon={faBellConcierge} />
						View Progress
					</Button>
				{/if}
			{/snippet}
		</SortableTable>
	{/if}
</div>

{#if selectedTransferId}
	<TransferProgressModal
		bind:open={showProgressModal}
		transferId={selectedTransferId}
		pollIntervalMs={null}
	/>
{/if}

<StartTransferModal bind:open={showStartTransferModal} onTransferCreated={handleTransferCreated} />
<LiveContentsModal bind:open={showLiveContentsModal} />

<style>
	.item-cell {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
	}

	.item-image {
		width: 34px;
		height: 34px;
		border-radius: 0.35rem;
		background: rgba(255, 255, 255, 0.04);
		padding: 0.15rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		flex-shrink: 0;
	}

	.item-name {
		font-weight: 600;
		color: var(--text-color-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.party {
		color: var(--text-color-1);
		font-weight: 500;
	}

	.party-cell {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		min-width: 0;
	}

	.party-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.player-avatar {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.35rem;
		flex-shrink: 0;
		image-rendering: pixelated;
	}

	.uuid {
		color: var(--text-color-2);
		font-family: monospace;
		font-size: 0.72rem;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.transfer-status {
		text-transform: capitalize;
		font-weight: 700;
		letter-spacing: 0.01em;
		white-space: nowrap;
	}

	.transfer-status.pending,
	.transfer-status.in_progress {
		color: rgb(var(--blue));
	}

	.transfer-status.completed {
		color: rgb(var(--green));
	}

	.transfer-status.failed,
	.transfer-status.cancelled {
		color: rgb(var(--red));
	}

	.muted {
		margin: 0;
		color: var(--text-color-2);
	}

	.error {
		margin: 0;
		color: rgb(var(--red));
	}
</style>
