<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faWallet, faPlus } from '@fortawesome/free-solid-svg-icons';
	import { fade, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import type { Address } from 'kromer';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import settings, { type Wallet } from '$lib/stores/settings';
	import { getSyncNode } from '$lib/consts';
	import ToggleCheckbox from '../form/ToggleCheckbox.svelte';
	import { paramState } from '$lib/paramState.svelte';
	import { t, t$ } from '$lib/i18n';
	import WalletCard from './wallets/WalletCard.svelte';
	import WalletCardCompact from './wallets/WalletCardCompact.svelte';
	import Button from '../ui/Button.svelte';
	import { addWalletModal } from '$lib/stores/addWalletModal';
	import { goto } from '$app/navigation';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		showDelete = false,
		showAddButton = false,
		compact = false,
		limit = 1000
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		showDelete?: boolean;
		showAddButton?: boolean;
		compact?: boolean;
		limit?: number;
	} = $props();

	function formatBalance(balance: number) {
		if (!browser) return '0.00';

		return balance.toLocaleString(navigator.language, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function deleteWallet(wallet: Wallet) {
		confirm.confirm({
			message: t('wallet.confirmDelete', { name: wallet.name, address: wallet.address }),
			danger: true,
			confirmButtonLabel: t('common.delete'),
			confirm: () => {
				settings.removeWallet(wallet.address);
				notifications.success(
					t('wallet.deleteSuccess', { name: wallet.name, address: wallet.address })
				);
			},
			cancel: () => {
				notifications.warning(t('wallet.deleteCancelled'));
			}
		});
	}

	let balances: Record<string, number> = $state({});
	let loading: boolean = $state(false);

	let showOtherNodes = paramState<boolean>('all_wallets', $settings.showAllWalletsDefault, {
		serialize: (value) => value.toString(),
		deserialize: (value) => value === 'true',
		shouldSet: (value) => value
	});

	let filteredWallets = $derived(
		$settings.wallets.filter((x) => showOtherNodes.value || x.syncNode === getSyncNode().id)
	);

	settings.subscribe(async ($store) => {
		if (browser) {
			const wallets = $store.wallets.filter(
				(x) => showOtherNodes.value || x.syncNode === getSyncNode().id
			);

			let neededWallets: string[] = [];
			let zeroedBalances: Record<string, number> = {};
			for (const wallet of wallets) {
				if (typeof balances[wallet.address] !== 'number') {
					neededWallets.push(wallet.address);
					zeroedBalances[wallet.address] = 0;
				}
			}

			if (neededWallets.length > 0) {
				loading = true;
				const retrieved = await kromer.addresses.getMultiple(neededWallets);
				balances = {
					...zeroedBalances,
					...balances,
					...Object.fromEntries(
						Object.values(retrieved).map((x: Address) => [x.address, x.balance])
					)
				};
				loading = false;
			}
		}
	});

	let totalBalance = $derived(
		filteredWallets.reduce((sum, wallet) => sum + (balances[wallet.address] || 0), 0)
	);

	// Quick action handlers
	function handleSend(wallet: Wallet) {
		goto(`/transactions/new?from=${wallet.address}`);
	}

	function handleViewHistory(wallet: Wallet) {
		goto(`/addresses/${wallet.address}`);
	}

	// Drag and drop for reordering
	let draggedWallet: Wallet | null = $state(null);
	let dragOverWallet: Wallet | null = $state(null);

	function handleDragStart(e: DragEvent, wallet: Wallet) {
		if (!e.dataTransfer) return;
		draggedWallet = wallet;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('wallet-address', wallet.address);
	}

	function handleDragEnd() {
		draggedWallet = null;
		dragOverWallet = null;
	}

	function handleDragOver(e: DragEvent, wallet: Wallet) {
		if (!e.dataTransfer) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		if (draggedWallet && wallet.address !== draggedWallet.address) {
			dragOverWallet = wallet;
		}
	}

	function handleDragLeave() {
		dragOverWallet = null;
	}

	function handleDrop(e: DragEvent, targetWallet: Wallet) {
		if (!e.dataTransfer || !draggedWallet) return;
		e.preventDefault();

		if (draggedWallet.address !== targetWallet.address) {
			const wallets = [...$settings.wallets];
			const fromIdx = wallets.findIndex((w) => w.address === draggedWallet!.address);
			const toIdx = wallets.findIndex((w) => w.address === targetWallet.address);
			if (fromIdx !== -1 && toIdx !== -1) {
				const [moved] = wallets.splice(fromIdx, 1);
				wallets.splice(toIdx, 0, moved);
				settings.setWallets(wallets);
				notifications.success(t('wallet.orderSaved'));
			}
		}

		draggedWallet = null;
		dragOverWallet = null;
	}

	function moveWallet(wallet: Wallet, direction: 'up' | 'down') {
		const wallets = [...$settings.wallets];
		const idx = wallets.findIndex((w) => w.address === wallet.address);
		if (idx === -1) return;

		const newIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (newIdx < 0 || newIdx >= wallets.length) return;

		const [moved] = wallets.splice(idx, 1);
		wallets.splice(newIdx, 0, moved);
		settings.setWallets(wallets);
	}

	function handleAddWallet() {
		addWalletModal.open();
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	{#snippet title()}
		<FontAwesomeIcon icon={faWallet} /> {$t$('nav.wallets')}
	{/snippet}
	{#snippet headerActions()}
		{#if showAddButton}
			<Button variant="primary" size="small" onClick={handleAddWallet}>
				<FontAwesomeIcon icon={faPlus} />
				{$t$('wallet.addWallet')}
			</Button>
		{/if}
	{/snippet}

	{#if !showDelete && !showAddButton}
		<a href="/wallets" id="view-all"> {$t$('wallet.viewAndManage')} </a>
	{/if}

	<div class="wallets-container">
		{#if $settings.showAllWalletsOption}
			<ToggleCheckbox bind:checked={showOtherNodes.value} center>
				{$t$('wallet.showAllWallets')}
			</ToggleCheckbox>
		{/if}
		{#if showOtherNodes.value}
			<div transition:slide>
				<Alert variant="info">
					<strong>{$t$('common.note')}:</strong>
					<p>{$t$('wallet.otherNodeNote')}</p>
				</Alert>
			</div>
		{/if}
		<ModuleLoading absolute={true} bind:loading />
		{#if filteredWallets.length === 0}
			<Alert variant="info">
				<strong>{$t$('wallet.noWalletsSaved')}</strong>
				<p>
					{$t$('wallet.noWalletsHint')}
					{#if showAddButton}
						<button class="link-button" onclick={handleAddWallet}>
							{$t$('wallet.addWalletHere')}
						</button>
					{:else}
						<a href="/wallets#new">{$t$('wallet.addWalletHere')}</a>
					{/if}
				</p>
			</Alert>
		{/if}
		{#if compact}
			<div class="wallets-grid compact" role="list">
				{#each filteredWallets.slice(0, limit) as wallet (wallet.address)}
					<div class="wallet-card-wrapper" role="listitem">
						<WalletCardCompact
							{wallet}
							balance={balances[wallet.address] || 0}
							onSend={() => handleSend(wallet)}
							onViewHistory={() => handleViewHistory(wallet)}
						/>
					</div>
				{/each}
			</div>
		{:else}
			<div class="wallets-grid" role="list">
				{#each filteredWallets.slice(0, limit) as wallet, index (wallet.address)}
					<div
						class="wallet-card-wrapper"
						class:dragging={draggedWallet?.address === wallet.address}
						class:drag-over={dragOverWallet?.address === wallet.address}
						role="listitem"
						draggable={showDelete}
						ondragstart={(e) => showDelete && handleDragStart(e, wallet)}
						ondragend={handleDragEnd}
						ondragover={(e) => handleDragOver(e, wallet)}
						ondragleave={handleDragLeave}
						ondrop={(e) => showDelete && handleDrop(e, wallet)}
						animate:flip={{ duration: 300 }}
					>
						<WalletCard
							{wallet}
							balance={balances[wallet.address] || 0}
							balanceChange={null}
							stats={null}
							{showDelete}
							canMoveUp={index > 0}
							canMoveDown={index < filteredWallets.length - 1}
							onDelete={() => deleteWallet(wallet)}
							onSend={() => handleSend(wallet)}
							onViewHistory={() => handleViewHistory(wallet)}
							onMoveUp={() => moveWallet(wallet, 'up')}
							onMoveDown={() => moveWallet(wallet, 'down')}
						/>
					</div>
				{/each}
			</div>
		{/if}
		{#if filteredWallets.length > 0}
			<div class="total-section" transition:fade>
				<p class="total">
					<strong>{$t$('wallet.totalBalance')}: </strong>
					<span class="total-amount">{formatBalance(totalBalance)}</span>
					<small>KRO</small>
				</p>
			</div>
		{/if}
	</div>
</Section>

<style>
	#view-all {
		display: block;
		font-size: 0.8em;
		color: var(--text-color-2);
		text-align: center;
		padding: 1em;
	}

	.wallets-container {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.wallets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1rem;
	}

	.wallets-grid.compact {
		grid-template-columns: 1fr;
		gap: 0.5rem;
	}

	.wallet-card-wrapper {
		position: relative;
		border-radius: 0.5rem;
		transition:
			transform 0.15s ease,
			opacity 0.15s ease;
	}

	.wallet-card-wrapper[draggable='true'] {
		cursor: grab;
	}

	.wallet-card-wrapper[draggable='true']:active {
		cursor: grabbing;
	}

	.wallet-card-wrapper.dragging {
		opacity: 0.5;
		transform: scale(0.98);
	}

	.wallet-card-wrapper.drag-over {
		transform: scale(1.02);
	}

	.wallet-card-wrapper.drag-over::before {
		content: '';
		position: absolute;
		inset: -4px;
		border: 2px dashed var(--theme-color-1);
		border-radius: 0.75rem;
		pointer-events: none;
		z-index: 1;
	}

	.total-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.total {
		text-align: right;
		font-size: 1.1rem;
		margin: 0;
		color: var(--text-color-2);
	}

	.total-amount {
		font-size: 1.3em;
		font-weight: 700;
		color: var(--text-color-1);
		margin: 0 0.25rem;
	}

	.link-button {
		background: transparent;
		border: none;
		color: var(--theme-color);
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
		font-size: inherit;
	}

	.link-button:hover {
		color: var(--theme-color-hover);
	}

	@media only screen and (max-width: 1024px) {
		.wallets-grid {
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		}
	}

	@media only screen and (max-width: 768px) {
		.wallets-grid {
			grid-template-columns: 1fr;
		}

		.total {
			text-align: center;
		}
	}
</style>
