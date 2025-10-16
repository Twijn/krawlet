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
			message: `Are you sure you want to delete the wallet ${wallet.name} (${wallet.address})? This action is irreversible!`,
			danger: true,
			confirmButtonLabel: 'Delete',
			confirm: () => {
				settings.removeWallet(wallet.address);
				notifications.success(`Successfully deleted wallet ${wallet.name} (${wallet.address})`);
			},
			cancel: () => {
				notifications.warning('Wallet deletion cancelled');
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
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faWallet} /> Wallets</h2>
	{#if !showDelete}
		<a href="/wallets" id="view-all"> View &amp; manage all wallets </a>
	{/if}

	<div class="wallets">
		{#if $settings.showAllWalletsOption}
			<ToggleCheckbox bind:checked={showOtherNodes.value} center>
				Show wallets from other sync nodes
			</ToggleCheckbox>
		{/if}
		{#if showOtherNodes.value}
			<div transition:slide>
				<Alert variant="info">
					<strong>Note:</strong>
					<p>Balances for wallets on other sync nodes may be inaccurate or not show at all.</p>
				</Alert>
			</div>
		{/if}
		<ModuleLoading absolute={true} bind:loading />
		{#if filteredWallets.length === 0}
			<Alert variant="info">
				<strong>No wallets saved!</strong>
				<p>
					You haven't saved a wallet yet! <a href="/wallets#new">Add one here!</a>
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
				}}
				ondragover={(e) => {
					if (!e.dataTransfer) return;
					e.preventDefault();
					e.dataTransfer.dropEffect = 'move';
					e.currentTarget.classList.add('drag-over');
				}}
				ondragleave={(e) => {
					e.currentTarget.classList.remove('drag-over');
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
							notifications.success(`Wallet order saved!`);
						}
					}
				}}
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
							<small><strong>Sync Node:</strong> {syncNodeName}</small>
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
				<strong>Total Balance: </strong>
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
