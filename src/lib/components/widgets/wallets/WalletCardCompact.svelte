<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faWallet, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import type { Wallet } from '$lib/stores/settings';
	import AddressModule from '../addresses/Address.svelte';
	import { t } from '$lib/i18n';

	const {
		wallet,
		balance = 0,
		onSend,
		onViewHistory
	}: {
		wallet: Wallet;
		balance?: number;
		onSend?: () => void;
		onViewHistory?: () => void;
	} = $props();

	function formatBalance(bal: number) {
		if (!browser) return '0.00';
		return bal.toLocaleString(navigator.language, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}
</script>

<div
	class="wallet-card-compact"
	transition:fade|local={{ duration: 200 }}
	onclick={onViewHistory}
	onkeypress={(e) => e.key === 'Enter' && onViewHistory?.()}
	role="button"
	tabindex="0"
	title={t('wallet.details')}
>
	<div class="wallet-icon">
		<FontAwesomeIcon icon={faWallet} />
	</div>
	<div class="wallet-content">
		<span class="wallet-name">{wallet.name}</span>
		<span class="wallet-address">
			<AddressModule address={wallet.address} showCopy={false} />
		</span>
	</div>
	<div class="wallet-balance">
		<span class="balance-amount">{formatBalance(balance)}</span>
		<span class="balance-currency">KRO</span>
	</div>
	<button
		class="send-btn"
		onclick={(e) => {
			e.stopPropagation();
			onSend?.();
		}}
		title={t('wallet.send')}
		aria-label={t('wallet.send')}
	>
		<FontAwesomeIcon icon={faPaperPlane} />
	</button>
</div>

<style>
	.wallet-card-compact {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background-color: var(--background-color-2);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		transition: all 0.15s ease;
		cursor: pointer;
		border: none;
		width: 100%;
		text-align: left;
		color: inherit;
		font-family: inherit;
	}

	.wallet-card-compact:hover {
		background-color: var(--background-color-3, rgba(255, 255, 255, 0.05));
		transform: translateY(-1px);
	}

	.wallet-card-compact:active {
		transform: translateY(0);
	}

	.wallet-icon {
		font-size: 1.25rem;
		color: var(--theme-color);
		flex-shrink: 0;
	}

	.wallet-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.wallet-name {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--text-color-1);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.wallet-address {
		font-size: 0.75rem;
		color: var(--text-color-2);
	}

	.wallet-balance {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.balance-amount {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-color-1);
	}

	.balance-currency {
		font-size: 0.7rem;
		color: var(--text-color-2);
	}

	.send-btn {
		background: var(--theme-color);
		border: none;
		color: white;
		padding: 0.5rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.85rem;
		transition:
			background 0.15s ease,
			transform 0.1s ease;
		flex-shrink: 0;
	}

	.send-btn:hover {
		background: var(--theme-color-hover, var(--theme-color));
		transform: scale(1.05);
	}

	.send-btn:active {
		transform: scale(0.95);
	}
</style>
