<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBars, faTrash, faWallet } from '@fortawesome/free-solid-svg-icons';
	import { fade, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import type { Address } from 'kromer';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import AddressModule from './addresses/Address.svelte';
	import settings, { type Wallet } from '$lib/stores/settings';
	import { getSyncNode, SYNC_NODES } from '$lib/consts';
	import ToggleCheckbox from '../form/ToggleCheckbox.svelte';
	import { paramState } from '$lib/paramState.svelte';
	import { t, t$ } from '$lib/i18n';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		showDelete = false,
		limit = 1000
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		showDelete?: boolean;
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
			// Zeroed balances adds wallets with 0 balance to the balances object
			// so that they show up as 0 instead of "Loading..." or not at all
			let zeroedBalances: Record<string, number> = {};
			for (const wallet of wallets) {
				// check the type instead of falsy because 0 is falsy
				if (typeof balances[wallet.address] !== 'number') {
					console.log('need', wallet);
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

	// Touch drag state for mobile support
	let touchDraggedAddress: string | null = $state(null);
	let touchDragElement: HTMLElement | null = null;

	function handleTouchStart(e: TouchEvent, address: string) {
		touchDraggedAddress = address;
		touchDragElement = e.currentTarget as HTMLElement;
		touchDragElement.classList.add('dragging');
	}

	function handleTouchMove(e: TouchEvent) {
		if (!touchDraggedAddress || !touchDragElement) return;

		e.preventDefault();
		const touch = e.touches[0];
		const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);

		// Remove drag-over from all wallets
		document.querySelectorAll('.wallet').forEach((el) => {
			el.classList.remove('drag-over');
		});

		// Add drag-over to the element under the touch
		if (elementAtPoint) {
			const walletElement = elementAtPoint.closest('.wallet');
			if (walletElement && walletElement !== touchDragElement) {
				walletElement.classList.add('drag-over');
			}
		}
	}

	function handleTouchEnd(e: TouchEvent, toAddress: string) {
		if (!touchDraggedAddress) return;

		const fromAddress = touchDraggedAddress;
		touchDragElement?.classList.remove('dragging');

		// Remove drag-over from all wallets
		document.querySelectorAll('.wallet').forEach((el) => {
			el.classList.remove('drag-over');
		});

		if (fromAddress !== toAddress) {
			const wallets = [...$settings.wallets];
			const fromIdx = wallets.findIndex((w) => w.address === fromAddress);
			const toIdx = wallets.findIndex((w) => w.address === toAddress);
			if (fromIdx !== -1 && toIdx !== -1) {
				const [moved] = wallets.splice(fromIdx, 1);
				wallets.splice(toIdx, 0, moved);
				settings.setWallets(wallets);
				notifications.success(t('wallet.orderSaved'));
			}
		}

		touchDraggedAddress = null;
		touchDragElement = null;
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faWallet} /> {$t$('nav.wallets')}</h2>
	{#if !showDelete}
		<a href="/wallets" id="view-all"> {$t$('wallet.viewAndManage')} </a>
	{/if}

	<div class="wallets">
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
					{$t$('wallet.noWalletsHint')} <a href="/wallets#new">{$t$('wallet.addWalletHere')}</a>
				</p>
			</Alert>
		{/if}
		{#each filteredWallets.slice(0, limit) as wallet (wallet.address)}
			{@const balance = balances[wallet.address] || 0}
			<div
				class="wallet"
				transition:fade|local={{ duration: 200 }}
				animate:flip={{ duration: 200 }}
				role="button"
				tabindex="0"
				draggable="true"
				ondragstart={(e) => {
					if (!e.dataTransfer) return;
					e.dataTransfer.setData('wallet-address', wallet.address);
					e.dataTransfer.effectAllowed = 'move';
					e.currentTarget.classList.add('dragging');
					console.log('Drag started:', wallet.address);
				}}
				ondragend={(e) => {
					e.currentTarget.classList.remove('dragging');
					document.querySelectorAll('.wallet').forEach((el) => {
						el.classList.remove('drag-over');
					});
					console.log('Drag ended');
				}}
				ondragenter={(e) => {
					if (!e.dataTransfer) return;
					e.preventDefault();
					e.currentTarget.classList.add('drag-over');
					console.log('Drag enter:', wallet.address);
				}}
				ondragover={(e) => {
					if (!e.dataTransfer) return;
					e.preventDefault();
					e.dataTransfer.dropEffect = 'move';
				}}
				ondragleave={(e) => {
					// Only remove if we're actually leaving this element (not a child)
					const rect = e.currentTarget.getBoundingClientRect();
					if (
						e.clientX <= rect.left ||
						e.clientX >= rect.right ||
						e.clientY <= rect.top ||
						e.clientY >= rect.bottom
					) {
						e.currentTarget.classList.remove('drag-over');
						console.log('Drag leave:', wallet.address);
					}
				}}
				ondrop={(e) => {
					if (!e.dataTransfer) return;
					e.preventDefault();
					e.currentTarget.classList.remove('drag-over');
					const fromAddress = e.dataTransfer.getData('wallet-address');
					const toAddress = wallet.address;
					if (fromAddress && fromAddress !== toAddress) {
						const wallets = [...$settings.wallets];
						const fromIdx = wallets.findIndex((w) => w.address === fromAddress);
						const toIdx = wallets.findIndex((w) => w.address === toAddress);
						if (fromIdx !== -1 && toIdx !== -1) {
							const [moved] = wallets.splice(fromIdx, 1);
							wallets.splice(toIdx, 0, moved);
							settings.setWallets(wallets);
							notifications.success(t('wallet.orderSaved'));
						}
					}
				}}
				ontouchstart={(e) => handleTouchStart(e, wallet.address)}
				ontouchmove={handleTouchMove}
				ontouchend={(e) => handleTouchEnd(e, wallet.address)}
			>
				<div class="icon">
					<FontAwesomeIcon icon={faWallet} />
				</div>
				<div class="info">
					<h3>{wallet.name}</h3>
					<div class="wallet-info">
						<AddressModule address={wallet.address} />
						{#if showOtherNodes.value}
							{@const syncNodeName =
								SYNC_NODES.find((x) => x.id === wallet.syncNode)?.name ?? 'Unknown'}
							<small><strong>{$t$('wallet.syncNode')}:</strong> {syncNodeName}</small>
						{/if}
					</div>
				</div>
				<div class="balance">
					{formatBalance(balance)}
					<small>KRO</small>
				</div>
				{#if showDelete}
					<div class="drag-handle manage-btn" title="Drag to reorder">
						<FontAwesomeIcon icon={faBars} />
					</div>
					<button class="manage-btn" onclick={() => deleteWallet(wallet)}>
						<FontAwesomeIcon icon={faTrash} />
					</button>
				{/if}
			</div>
		{/each}
		{#if filteredWallets.length > 0}
			<p class="total">
				<strong>{$t$('wallet.totalBalance')}: </strong>
				{formatBalance(totalBalance)}
				<small>KRO</small>
			</p>
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

	.wallets {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.75em;
	}

	.wallet {
		display: flex;
		align-items: center;
		background-color: rgba(0, 0, 0, 0.1);
		color: var(--text-color-1);
		text-decoration: none;
		padding: 1em;
		border-radius: 0.25em;
		gap: 1em;
		transform-origin: top;
		cursor: grab;
		border: 2px solid transparent;
		position: relative;
	}

	.wallet :global(.dragging),
	:global(.wallet.dragging) {
		opacity: 0.6;
		cursor: grabbing;
	}

	.wallet :global(.drag-over),
	:global(.wallet.drag-over) {
		background-color: rgba(100, 150, 255, 0.15);
		border-color: rgba(100, 200, 255, 0.6);
		border-style: solid;
	}

	.wallet .icon {
		color: var(--text-color-2);
		font-size: 1.75em;
	}

	.wallet .info {
		flex: 1;
	}

	.wallet h3 {
		font-size: 1rem;
		margin: 0 0 0.25em 0;
	}

	.wallet .balance {
		font-size: 1.3em;
		font-weight: 500;
	}

	.total {
		text-align: right;
		font-size: 0.9em;
		margin-right: 0.25em;
	}

	.manage-btn {
		color: var(--text-color-2);
		background-color: transparent;
		padding: 0.5em;
		margin: 0;
		border: none;
		cursor: pointer;
		font-size: 0.9em;
		transition: color 0.2s ease-in-out;
	}

	.manage-btn:hover,
	.manage-btn:focus {
		color: white;
	}

	@media only screen and (max-width: 768px) {
		.wallet :global(svg) {
			margin-right: 0;
		}
	}
</style>
