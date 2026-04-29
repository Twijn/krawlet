<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faWallet, faPlus, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import { fade } from 'svelte/transition';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import settings from '$lib/stores/settings';
	import { t$ } from '$lib/i18n';
	import Button from '../../ui/Button.svelte';
	import { addWalletModal } from '$lib/stores/addWalletModal';
	import { formatCurrency } from '$lib/util';
	import AddressComp from '../addresses/Address.svelte';
	import { AddressCache } from '$lib/cache/AddressCache';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		showDelete = false,
		showAddButton = false,
		limit = 1000
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		showDelete?: boolean;
		showAddButton?: boolean;
		limit?: number;
	} = $props();

	const addressCache = new AddressCache();
	const getWalletAddresses = () => $settings.wallets.map((wallet) => wallet.address);

	let filteredWallets = $derived($settings.wallets);
	let walletAddresses = $derived(filteredWallets.map((wallet) => wallet.address));
	let walletAddressesKey = $derived(walletAddresses.join(','));
	let lastRequestedWalletAddressesKey = $state<string | null>(null);

	const addressStore = addressCache.get({
		addresses: getWalletAddresses()
	});

	let balances: Record<string, number> = $derived(
		Object.fromEntries(
			filteredWallets.map((wallet) => [
				wallet.address,
				$addressStore?.data?.addressList?.[wallet.address]?.balance ?? 0
			])
		)
	);

	$effect(() => {
		if (walletAddressesKey === lastRequestedWalletAddressesKey) return;
		lastRequestedWalletAddressesKey = walletAddressesKey;
		addressCache.update({ addresses: [...walletAddresses] });
	});

	let totalBalance = $derived(
		filteredWallets.reduce((sum, wallet) => sum + (balances[wallet.address] || 0), 0)
	);

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
		<div class="wallets-grid" role="list">
			{#each filteredWallets.slice(0, limit) as wallet (wallet.address)}
				<div class="wallet" role="listitem">
					<div class="wallet-cell wallet-address">
						<AddressComp address={wallet.address} showCopy={false} />
					</div>
					<div class="wallet-cell wallet-balance">
						<span class="amount">{formatCurrency(balances[wallet.address] || 0)}</span>
						<small>KRO</small>
					</div>
					<div class="wallet-cell actions">
						<Button
							href={`/transactions/new?from=${wallet.address}`}
							variant="primary"
							size="xsmall"
							icon={faPaperPlane}
							tk="wallet.send"
						/>
					</div>
				</div>
			{/each}
		</div>
		{#if filteredWallets.length > 0}
			<div class="total-section" transition:fade>
				<p class="total">
					<strong>{$t$('wallet.totalBalance')}: </strong>
					<span class="total-amount">{formatCurrency(totalBalance)}</span>
					<small>KRO</small>
				</p>
			</div>
		{/if}
	</div>
</Section>

<style>
	#view-all {
		display: block;
		text-align: center;
		font-size: 0.8em;
		color: var(--text-color-2);
		margin: 0.15rem 0 0.9rem;
	}

	.wallets-container {
		position: relative;
	}

	.wallets-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		margin-top: 0.25rem;
	}

	.wallet {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 0.85rem;
		border-radius: 0.6rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.015));
		transition:
			background-color 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}

	.wallet:hover {
		background-color: rgba(var(--theme-color-rgb), 0.07);
		border-color: rgba(var(--theme-color-rgb), 0.45);
		transform: translateY(-1px);
	}

	.wallet-cell {
		min-width: 0;
	}

	.wallet-address {
		text-align: left;
	}

	.wallet-balance {
		display: flex;
		align-items: baseline;
		justify-content: flex-end;
		gap: 0.3rem;
	}

	.amount {
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
	}

	.total-section {
		margin-top: 0.85rem;
		padding-top: 0.85rem;
		border-top: 1px solid rgba(var(--theme-color-rgb), 0.35);
	}

	.total {
		display: flex;
		align-items: baseline;
		justify-content: flex-end;
		gap: 0.35rem;
		margin: 0;
	}

	.total-amount {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--theme-color-2);
	}

	button.link-button {
		appearance: none;
		background: transparent;
		border: none;
		color: var(--theme-color-2);
		font: inherit;
		padding: 0;
		margin-left: 0.3rem;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	button.link-button:hover,
	button.link-button:focus-visible {
		color: rgb(var(--theme-color-rgb));
	}

	@media only screen and (max-width: 700px) {
		.wallet {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas:
				'address action'
				'balance action';
			row-gap: 0.4rem;
		}

		.wallet-address {
			grid-area: address;
		}

		.wallet-balance {
			grid-area: balance;
			justify-content: flex-start;
		}

		.actions {
			grid-area: action;
		}

		.total {
			justify-content: flex-start;
		}
	}

	@media only screen and (max-width: 420px) {
		.wallet {
			padding: 0.6rem 0.65rem;
		}

		.amount {
			font-size: 0.98rem;
		}
	}
</style>
