<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faWallet,
		faArrowUp,
		faArrowDown,
		faPaperPlane,
		faCopy,
		faCircleInfo,
		faTrash,
		faBars,
		faChevronDown,
		faChevronUp
	} from '@fortawesome/free-solid-svg-icons';
	import { fade, slide } from 'svelte/transition';
	import { browser } from '$app/environment';
	import type { Wallet } from '$lib/stores/settings';
	import AddressModule from '../addresses/Address.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { t } from '$lib/i18n';

	type WalletStats = {
		totalSent: number;
		totalReceived: number;
		transactionCount: number;
	};

	type BalanceChange = {
		amount: number;
		percentage: number;
		direction: 'up' | 'down' | 'neutral';
	};

	const {
		wallet,
		balance = 0,
		balanceChange = null,
		stats = null,
		showDelete = false,
		onDelete,
		onSend,
		onViewHistory
	}: {
		wallet: Wallet;
		balance?: number;
		balanceChange?: BalanceChange | null;
		stats?: WalletStats | null;
		showDelete?: boolean;
		onDelete?: () => void;
		onSend?: () => void;
		onViewHistory?: () => void;
	} = $props();

	let expanded = $state(false);

	function formatBalance(bal: number) {
		if (!browser) return '0.00';
		return bal.toLocaleString(navigator.language, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function formatCompact(num: number) {
		if (!browser) return '0';
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toFixed(0);
	}

	function copyAddress() {
		navigator.clipboard.writeText(wallet.address).then(
			() => {
				notifications.success(t('wallet.addressCopied', { address: wallet.address }));
			},
			() => {
				notifications.error(t('wallet.addressCopyFailed'));
			}
		);
	}

	function toggleExpanded() {
		expanded = !expanded;
	}
</script>

<div
	class="wallet-card"
	transition:fade|local={{ duration: 200 }}
	role="article"
	aria-label="Wallet {wallet.name}"
>
	<!-- Card header -->
	<div class="card-header">
		<div class="icon">
			<FontAwesomeIcon icon={faWallet} />
		</div>
		<div class="wallet-info">
			<h3>{wallet.name}</h3>
			<div class="address-line">
				<AddressModule address={wallet.address} showCopy={false} />
			</div>
		</div>
		{#if showDelete}
			<div class="header-actions">
				<div class="drag-handle" title={t('wallet.dragToReorder')}>
					<FontAwesomeIcon icon={faBars} />
				</div>
				<button
					class="delete-btn"
					onclick={onDelete}
					aria-label={t('wallet.delete')}
					title={t('wallet.delete')}
				>
					<FontAwesomeIcon icon={faTrash} />
				</button>
			</div>
		{/if}
	</div>

	<!-- Balance display -->
	<div class="balance-section">
		<div class="balance-main">
			<span class="amount">{formatBalance(balance)}</span>
			<span class="currency">KRO</span>
		</div>
		{#if balanceChange}
			<div
				class="balance-change"
				class:positive={balanceChange.direction === 'up'}
				class:negative={balanceChange.direction === 'down'}
			>
				<FontAwesomeIcon
					icon={balanceChange.direction === 'up' ? faArrowUp : faArrowDown}
				/>
				<span>{Math.abs(balanceChange.percentage).toFixed(2)}%</span>
				<span class="change-amount">
					({balanceChange.amount >= 0 ? '+' : ''}{formatCompact(balanceChange.amount)})
				</span>
			</div>
		{/if}
	</div>

	<!-- Transaction stats -->
	{#if stats}
		<div class="stats-section">
			<div class="stat">
				<div class="stat-label">{t('wallet.totalSent')}</div>
				<div class="stat-value">{formatCompact(stats.totalSent)}</div>
			</div>
			<div class="stat">
				<div class="stat-label">{t('wallet.totalReceived')}</div>
				<div class="stat-value">{formatCompact(stats.totalReceived)}</div>
			</div>
			<div class="stat">
				<div class="stat-label">{t('wallet.transactions')}</div>
				<div class="stat-value">{stats.transactionCount}</div>
			</div>
		</div>
	{/if}

	<!-- Quick actions -->
	<div class="actions-section">
		<Button variant="secondary" size="small" full={true} onClick={copyAddress}>
			<FontAwesomeIcon icon={faCopy} />
			{t('wallet.copy')}
		</Button>
		<Button variant="secondary" size="small" full={true} onClick={onViewHistory}>
			<FontAwesomeIcon icon={faCircleInfo} />
			{t('wallet.details')}
		</Button>
		<div class="send-btn-wrapper">
			<Button variant="primary" size="small" full={true} onClick={onSend}>
				<FontAwesomeIcon icon={faPaperPlane} />
				{t('wallet.send')}
			</Button>
		</div>
	</div>

	<!-- Expandable details (future use) -->
	<button class="expand-toggle" onclick={toggleExpanded} aria-expanded={expanded}>
		<FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
		{expanded ? t('common.showLess') : t('common.showMore')}
	</button>

	{#if expanded}
		<div class="expanded-content" transition:slide={{ duration: 200 }}>
			<p class="expanded-placeholder">{t('wallet.moreDetailsComingSoon')}</p>
		</div>
	{/if}
</div>

<style>
	.wallet-card {
		position: relative;
		background-color: var(--background-color-2);
		border-radius: 0.5rem;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.2);
		padding: 1rem;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.wallet-card:hover {
		box-shadow: 0 0 1.5em rgba(0, 0, 0, 0.3);
	}

	.wallet-card:global(.dragging) {
		opacity: 0.6;
		cursor: grabbing;
	}

	.wallet-card:global(.drag-over) {
		background: linear-gradient(135deg, rgba(100, 150, 255, 0.2) 0%, rgba(0, 0, 0, 0.3) 100%);
		border-color: rgba(100, 200, 255, 0.6);
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.drag-handle {
		color: var(--text-color-2);
		cursor: grab;
		padding: 0.5rem;
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	.drag-handle:hover {
		opacity: 1;
	}

	.icon {
		font-size: 2rem;
		color: var(--theme-color);
		flex-shrink: 0;
	}

	.wallet-info {
		flex: 1;
		min-width: 0;
	}

	.wallet-info h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-color-1);
	}

	.address-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.delete-btn {
		color: var(--text-color-2);
		background: transparent;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		transition: color 0.2s ease;
		font-size: 1rem;
	}

	.delete-btn:hover,
	.delete-btn:focus {
		color: #ff6b6b;
	}

	.balance-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem 0;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.balance-main {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.balance-main .amount {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-color-1);
		line-height: 1;
	}

	.balance-main .currency {
		font-size: 1rem;
		color: var(--text-color-2);
		font-weight: 500;
	}

	.balance-change {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		margin-top: 0.5rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
	}

	.balance-change.positive {
		color: #51cf66;
		background-color: rgba(81, 207, 102, 0.1);
	}

	.balance-change.negative {
		color: #ff6b6b;
		background-color: rgba(255, 107, 107, 0.1);
	}

	.balance-change .change-amount {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.stats-section {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.stat {
		text-align: center;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--text-color-2);
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-color-1);
	}

	.actions-section {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		margin-top: auto;
	}

	.send-btn-wrapper {
		grid-column: 1 / -1;
	}

	.expand-toggle {
		background: transparent;
		border: none;
		color: var(--text-color-2);
		cursor: pointer;
		padding: 0.5rem;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: color 0.2s ease;
	}

	.expand-toggle:hover,
	.expand-toggle:focus {
		color: var(--text-color-1);
	}

	.expanded-content {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.expanded-placeholder {
		text-align: center;
		color: var(--text-color-2);
		font-style: italic;
		margin: 0;
	}

	@media only screen and (max-width: 768px) {
		.wallet-card {
			padding: 0.75rem;
		}

		.stats-section {
			grid-template-columns: 1fr;
		}
	}
</style>
