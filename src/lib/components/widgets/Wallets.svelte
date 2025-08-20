<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrash, faWallet } from '@fortawesome/free-solid-svg-icons';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { type Wallet, walletStore } from '$lib/walletStore';
	import type { Address } from 'kromer';
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';

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
			confirm: () => {
				delete addresses[wallet.address];
				addresses = { ...addresses };
				walletStore.removeWallet(wallet.address);
				notifications.success(`Successfully deleted wallet ${wallet.name} (${wallet.address})`);
			},
			cancel: () => {
				notifications.warning('Wallet deletion cancelled');
			}
		});
	}

	let addresses: Record<string, Address> = $state({});
	let loading: boolean = $state(false);

	walletStore.subscribe(async ($store) => {
		if (browser) {
			if ($store.wallets.length > 0) {
				loading = true;
				addresses = await kromer.addresses.getMultiple(
					$store.wallets.slice(0, limit).map((x) => x.address)
				);
				loading = false;
			} else {
				addresses = {};
			}
		}
	});

	let totalBalance = $derived(
		Object.values(addresses).reduce((sum, address) => sum + address.balance, 0)
	);
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faWallet} /> Wallets</h2>
	{#if !showDelete}
		<a href="/wallets" id="view-all"> View &amp; manage all wallets </a>
	{/if}

	<div class="wallets">
		<ModuleLoading absolute={true} bind:loading />
		{#if $walletStore.wallets.length === 0}
			<Alert variant="info">
				<strong>No wallets saved!</strong>
				<p>
					You haven't saved a wallet yet! <a href="/wallets#new">Add one here!</a>
				</p>
			</Alert>
		{/if}
		{#each $walletStore.wallets.slice(0, limit) as wallet (wallet.address)}
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
					<a href="/addresses/{wallet.address}">
						{wallet.address}
					</a>
				</div>
				<div class="balance">
					{formatBalance(balance)}
					<small>KRO</small>
				</div>
				{#if showDelete}
					<Button variant="error" onClick={() => deleteWallet(wallet)}>
						<FontAwesomeIcon icon={faTrash} />
						<span class="delete-text">Delete</span>
					</Button>
				{/if}
			</div>
		{/each}
		{#if $walletStore.wallets.length > 0}
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

	.wallet a {
		font-size: 0.9rem;
		margin: 0;
	}

	.wallet .balance {
		font-size: 1.3em;
		font-weight: 500;
	}

	.total {
		text-align: right;
		font-size: 0.9em;
		margin-right: 0.5em;
	}

	@media only screen and (max-width: 768px) {
		.delete-text {
			display: none;
		}

		.wallet :global(svg) {
			margin-right: 0;
		}
	}
</style>
