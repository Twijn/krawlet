<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrash, faWallet } from '@fortawesome/free-solid-svg-icons';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { type Wallet, walletStore } from '$lib/walletStore';
	import type { Address } from 'kromer';
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		showDelete = false
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		showDelete?: boolean;
	} = $props();

	function formatBalance(balance: number) {
		if (!browser) return '0.00';

		return balance.toLocaleString(navigator.language, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function deleteWallet(wallet: Wallet) {
		if (
			confirm(
				`Are you sure you want to delete the wallet ${wallet.name} (${wallet.address})? This action is irreversible!`
			)
		) {
			delete addresses[wallet.address];
			addresses = { ...addresses };
			walletStore.removeWallet(wallet.address);
		}
	}

	let addresses: Record<string, Address> = $state({});
	let loading: boolean = $state(true);

	walletStore.subscribe(async ($store) => {
		if (browser) {
			loading = true;
			addresses = await kromer.addresses.getMultiple($store.wallets.map((x) => x.address));
			loading = false;
		}
	});

	let totalBalance = $derived(
		Object.values(addresses).reduce((sum, address) => sum + address.balance, 0)
	);
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faWallet} /> Wallets</h2>

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
		{#each $walletStore.wallets as wallet (wallet.address)}
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
						Delete
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
</style>
