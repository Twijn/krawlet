<script lang="ts">
	import type { Transfer } from 'krawlet-js';
	import { getMinecraftAvatar, relativeTime } from '$lib/util';
	import LiveContentsModal from '$lib/components/dialogs/LiveContentsModal.svelte';
	import StartTransferModal from '$lib/components/dialogs/StartTransferModal.svelte';
	import TransferProgressModal from '$lib/components/dialogs/TransferProgressModal.svelte';
	import type { BreadcrumbButton } from '$lib/components/ui/Breadcrumbs';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import type { SortableColumnData } from '$lib/components/ui/SortableTable';
	import { krawletWebsocket } from '$lib/stores/krawletWebsocket';
	import { faBellConcierge, faBoxArchive, faPlus } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	const transferListStore = krawletWebsocket.transfers;
	const transferErrorStore = krawletWebsocket.error;
	const transferList = $derived($transferListStore ?? []);
	const transferError = $derived($transferErrorStore);

	type RouteTransfer = Transfer & {
		fromName?: string | null;
		toName?: string | null;
		fromUUID?: string | null;
		toUUID?: string | null;
		itemDisplayName?: string | null;
	};

	type TransferColumn =
		| 'itemName'
		| 'fromUsername'
		| 'toUsername'
		| 'quantityTransferred'
		| 'quantity'
		| 'status'
		| 'timestamp'
		| 'actions';

	const columns: SortableColumnData<TransferColumn>[] = [
		{ key: 'itemName', label: 'Item', sortable: true },
		{ key: 'fromUsername', label: 'From', sortable: true },
		{ key: 'toUsername', label: 'To', sortable: true },
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

	function getTransferItemLabel(transfer: RouteTransfer): string {
		return transfer.itemDisplayName ?? transfer.itemName ?? 'Unknown item';
	}

	function compareTransfers(a: RouteTransfer, b: RouteTransfer): number {
		if (!sortedColumn) return 0;

		if (sortedColumn === 'itemName') {
			const aValue = getTransferItemLabel(a);
			const bValue = getTransferItemLabel(b);
			return sortDirection === 'ASC' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
		}

		if (sortedColumn === 'fromUsername' || sortedColumn === 'toUsername') {
			const aValue = sortedColumn === 'fromUsername' ? (a.fromUsername ?? a.fromName ?? '') : (a.toUsername ?? a.toName ?? '');
			const bValue = sortedColumn === 'fromUsername' ? (b.fromUsername ?? b.fromName ?? '') : (b.toUsername ?? b.toName ?? '');
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
	{#if transferError}
		<p class="error">Error loading transfers: {transferError}</p>
	{:else if transferList.length === 0}
		<p class="muted">No transfer history.</p>
	{:else}
		<SortableTable
			bind:sortedColumn
			bind:sortDirection
			{columns}
			{refresh}
			data={getSortedTransfers(transferList)}
		>
			{#snippet cell(item, column)}
				{@const itemLabel = getTransferItemLabel(item)}
				{@const isFromMC = item.fromMcName && item.fromEntityId}
				{@const isToMC = item.toMcName && item.toEntityId}
				{@const fromName = item.fromMcName ? item.fromMcName : item.fromName}
				{@const fromUuid = item.fromMcName ? item.fromMcUuid : item.fromEntityId}
				{@const toName = item.toMcName ? item.toMcName : item.toName}
				{@const toUuid = item.toMcName ? item.toMcUuid : item.toEntityId}
				{#if column.key === 'itemName'}
					<div class="item-cell">
						<img
							src={getTransferImageUrl(item.itemName)}
							alt={itemLabel}
							class="item-image"
							loading="lazy"
						/>
						<span class="item-name">{itemLabel}</span>
					</div>
				{:else if column.key === 'quantityTransferred'}
					{(item.quantityTransferred ?? 0).toLocaleString()}
				{:else if column.key === 'fromUsername'}
					<div class="party-cell">
						{#if isFromMC}
							<img
								class="player-avatar"
								src={getMinecraftAvatar(fromUuid ?? '', 32)}
								alt="Avatar for {fromName}"
								loading="lazy"
							/>
						{/if}
						<div class="party-text">
							<span class="party">{fromName}</span>
						</div>
					</div>
				{:else if column.key === 'toUsername'}
					<div class="party-cell">
						{#if isToMC}
							<img
								class="player-avatar"
								src={getMinecraftAvatar(toUuid ?? '', 32)}
								alt="Avatar for {toName}"
								loading="lazy"
							/>
						{/if}
						<div class="party-text">
							<span class="party">{toName}</span>
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
		<TransferProgressModal bind:open={showProgressModal} transferId={selectedTransferId} />
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
