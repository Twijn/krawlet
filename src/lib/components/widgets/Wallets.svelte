<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrash, faWallet } from '@fortawesome/free-solid-svg-icons';
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
				delete addresses[wallet.address];
				addresses = { ...addresses };
				settings.removeWallet(wallet.address);
				notifications.success(`Successfully deleted wallet ${wallet.name} (${wallet.address})`);
			},
			cancel: () => {
				notifications.warning('Wallet deletion cancelled');
			}
		});
	}

	let addresses: Record<string, Address> = $state({});
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
			if (wallets.length > 0) {
				loading = true;
				addresses = await kromer.addresses.getMultiple(wallets.map((x) => x.address));
				loading = false;
			} else {
				addresses = {};
			}
		}
	});

	let totalBalance = $derived(
		filteredWallets.reduce((sum, wallet) => sum + (addresses[wallet.address]?.balance || 0), 0)
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
			{@const balance = addresses[wallet.address] ? addresses[wallet.address].balance : 0}
			<div
				class="wallet"
				transition:fade|local={{ duration: 200 }}
				animate:flip={{ duration: 200 }}
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
					<button class="delete-btn" onclick={() => deleteWallet(wallet)}>
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

	.delete-btn {
		color: white;
		background-color: transparent;
		padding: 0.5em;
		margin: 0;
		border: none;
		cursor: pointer;
		font-size: 0.9em;
		opacity: 0.5;
		transition: opacity 0.2s ease-in-out;
	}

	.delete-btn:hover,
	.delete-btn:focus {
		opacity: 0.75;
	}

	@media only screen and (max-width: 768px) {
		.wallet :global(svg) {
			margin-right: 0;
		}
	}
</style>
