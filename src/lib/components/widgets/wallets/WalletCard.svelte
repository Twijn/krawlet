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
		faGripVertical,
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
	import kromer from '$lib/api/kromer';
	import type { Transaction } from 'kromer';
	import { withRateLimitRetry, batchDelay } from '$lib/utils/rateLimit';

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
		canMoveUp = false,
		canMoveDown = false,
		onDelete,
		onSend,
		onViewHistory,
		onMoveUp,
		onMoveDown
	}: {
		wallet: Wallet;
		balance?: number;
		balanceChange?: BalanceChange | null;
		stats?: WalletStats | null;
		showDelete?: boolean;
		canMoveUp?: boolean;
		canMoveDown?: boolean;
		onDelete?: () => void;
		onSend?: () => void;
		onViewHistory?: () => void;
		onMoveUp?: () => void;
		onMoveDown?: () => void;
	} = $props();

	let expanded = $state(false);
	let loadingStats = $state(false);
	let statsLoaded = $state(false);

	// Timeframe view modes
	type TimeframeMode = 'cumulative' | 'daily' | 'weekly';
	let timeframeMode: TimeframeMode = $state('cumulative');

	// Timeframe definitions in milliseconds
	const DAY_MS = 24 * 60 * 60 * 1000;
	const WEEK_MS = 7 * DAY_MS;

	const TIMEFRAMES = {
		'24h': DAY_MS,
		'7d': WEEK_MS,
		'30d': 30 * DAY_MS
	};

	// Calculated statistics
	type TimeframeStats = {
		totalIn: number;
		totalOut: number;
		welfare: number;
		netChange: number;
		txCount: number;
	};

	const emptyStats = (): TimeframeStats => ({
		totalIn: 0,
		totalOut: 0,
		welfare: 0,
		netChange: 0,
		txCount: 0
	});

	// Cumulative view stats (24h, 7d, 30d)
	let stats24h: TimeframeStats = $state(emptyStats());
	let stats7d: TimeframeStats = $state(emptyStats());
	let stats30d: TimeframeStats = $state(emptyStats());

	// Daily comparison stats (2 days ago, 1 day ago, last 24h)
	let statsDay2Ago: TimeframeStats = $state(emptyStats());
	let statsDay1Ago: TimeframeStats = $state(emptyStats());
	let statsLast24h: TimeframeStats = $state(emptyStats());

	// Weekly comparison stats (2 weeks ago, 1 week ago, last 7d)
	let statsWeek2Ago: TimeframeStats = $state(emptyStats());
	let statsWeek1Ago: TimeframeStats = $state(emptyStats());
	let statsLastWeek: TimeframeStats = $state(emptyStats());

	let allTimeStats: TimeframeStats = $state(emptyStats());
	let uniqueAddresses = $state(0);
	let avgTxSize = $state(0);

	function calculateStats(txs: Transaction[], cutoffMs: number): TimeframeStats {
		const cutoffTime = Date.now() - cutoffMs;
		const filtered = txs.filter((tx) => tx.time.getTime() >= cutoffTime);

		let totalIn = 0;
		let totalOut = 0;
		let welfare = 0;

		for (const tx of filtered) {
			if (tx.to === wallet.address) {
				if (tx.type === 'mined') {
					welfare += tx.value;
				} else {
					totalIn += tx.value;
				}
			}
			if (tx.from === wallet.address) {
				totalOut += tx.value;
			}
		}

		return {
			totalIn,
			totalOut,
			welfare,
			netChange: totalIn + welfare - totalOut,
			txCount: filtered.length
		};
	}

	// Calculate stats for a specific time window (from startMs ago to endMs ago)
	function calculateStatsWindow(
		txs: Transaction[],
		startMsAgo: number,
		endMsAgo: number
	): TimeframeStats {
		const now = Date.now();
		const startTime = now - startMsAgo;
		const endTime = now - endMsAgo;
		const filtered = txs.filter((tx) => {
			const txTime = tx.time.getTime();
			return txTime >= startTime && txTime < endTime;
		});

		let totalIn = 0;
		let totalOut = 0;
		let welfare = 0;

		for (const tx of filtered) {
			if (tx.to === wallet.address) {
				if (tx.type === 'mined') {
					welfare += tx.value;
				} else {
					totalIn += tx.value;
				}
			}
			if (tx.from === wallet.address) {
				totalOut += tx.value;
			}
		}

		return {
			totalIn,
			totalOut,
			welfare,
			netChange: totalIn + welfare - totalOut,
			txCount: filtered.length
		};
	}

	function calculateAllTimeStats(txs: Transaction[]): TimeframeStats {
		let totalIn = 0;
		let totalOut = 0;
		let welfare = 0;

		for (const tx of txs) {
			if (tx.to === wallet.address) {
				if (tx.type === 'mined') {
					welfare += tx.value;
				} else {
					totalIn += tx.value;
				}
			}
			if (tx.from === wallet.address) {
				totalOut += tx.value;
			}
		}

		return {
			totalIn,
			totalOut,
			welfare,
			netChange: totalIn + welfare - totalOut,
			txCount: txs.length
		};
	}

	async function fetchWalletStats() {
		if (statsLoaded || loadingStats || !browser) return;

		loadingStats = true;
		try {
			// Fetch transactions for this address (up to 5000 for comprehensive stats)
			const allTxs: Transaction[] = [];
			let offset = 0;
			let limit = 250;
			let keepFetching = true;
			const maxTxs = 5000;
			let iteration = 0;

			while (keepFetching && allTxs.length < maxTxs) {
				// Add delay between batches to respect rate limits
				await batchDelay(iteration, 3, 150);

				const resp = await withRateLimitRetry(() =>
					kromer.addresses.getTransactions(wallet.address, {
						offset,
						limit
					})
				);

				allTxs.push(...resp.transactions);

				if (resp.transactions.length < limit) {
					keepFetching = false;
				} else {
					offset += limit;
					// Increase limit after first request for faster fetching
					limit = 1000;
				}
				iteration++;
			}

			transactions = allTxs;

			// Calculate cumulative timeframe stats (24h, 7d, 30d from now)
			stats24h = calculateStats(allTxs, TIMEFRAMES['24h']);
			stats7d = calculateStats(allTxs, TIMEFRAMES['7d']);
			stats30d = calculateStats(allTxs, TIMEFRAMES['30d']);

			// Calculate daily comparison stats (each individual day)
			statsLast24h = calculateStatsWindow(allTxs, DAY_MS, 0); // Last 24 hours
			statsDay1Ago = calculateStatsWindow(allTxs, 2 * DAY_MS, DAY_MS); // 24-48 hours ago
			statsDay2Ago = calculateStatsWindow(allTxs, 3 * DAY_MS, 2 * DAY_MS); // 48-72 hours ago

			// Calculate weekly comparison stats (each individual week)
			statsLastWeek = calculateStatsWindow(allTxs, WEEK_MS, 0); // Last 7 days
			statsWeek1Ago = calculateStatsWindow(allTxs, 2 * WEEK_MS, WEEK_MS); // 7-14 days ago
			statsWeek2Ago = calculateStatsWindow(allTxs, 3 * WEEK_MS, 2 * WEEK_MS); // 14-21 days ago

			allTimeStats = calculateAllTimeStats(allTxs);

			// Calculate unique addresses interacted with and average transaction size
			const addresses: string[] = [];
			let totalValue = 0;

			for (const tx of allTxs) {
				if (tx.from && tx.from !== wallet.address && !addresses.includes(tx.from)) {
					addresses.push(tx.from);
				}
				if (tx.to && tx.to !== wallet.address && !addresses.includes(tx.to)) {
					addresses.push(tx.to);
				}
				totalValue += tx.value;
			}

			uniqueAddresses = addresses.length;
			avgTxSize = allTxs.length > 0 ? totalValue / allTxs.length : 0;

			statsLoaded = true;
		} catch (error) {
			console.error('Failed to fetch wallet stats:', error);
		} finally {
			loadingStats = false;
		}
	}

	function formatBalance(bal: number) {
		if (!browser) return '0.00';
		return bal.toLocaleString(navigator.language, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function formatCompact(num: number) {
		if (!browser) return '0.00';
		if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
		return num.toFixed(2);
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
		if (expanded && !statsLoaded) {
			fetchWalletStats();
		}
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
				<div class="reorder-controls">
					<button
						class="move-btn"
						onclick={onMoveUp}
						disabled={!canMoveUp}
						aria-label={t('wallet.moveUp')}
						title={t('wallet.moveUp')}
					>
						<FontAwesomeIcon icon={faChevronUp} />
					</button>
					<div class="drag-handle" title={t('wallet.dragToReorder')}>
						<FontAwesomeIcon icon={faGripVertical} />
					</div>
					<button
						class="move-btn"
						onclick={onMoveDown}
						disabled={!canMoveDown}
						aria-label={t('wallet.moveDown')}
						title={t('wallet.moveDown')}
					>
						<FontAwesomeIcon icon={faChevronDown} />
					</button>
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
				<FontAwesomeIcon icon={balanceChange.direction === 'up' ? faArrowUp : faArrowDown} />
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
	<button class="expand-toggle" class:expanded onclick={toggleExpanded} aria-expanded={expanded}>
		<span class="toggle-icon">
			<FontAwesomeIcon icon={faChevronDown} />
		</span>
		<span class="toggle-text">
			{expanded ? t('wallet.hideStatistics') : t('wallet.showStatistics')}
		</span>
	</button>

	{#if expanded}
		<div class="expanded-content" transition:slide={{ duration: 200 }}>
			{#if loadingStats}
				<div class="loading-stats">
					<span class="loading-spinner"></span>
					<span>{t('wallet.loadingStats')}</span>
				</div>
			{:else if statsLoaded}
				<div class="expanded-stats">
					<!-- Timeframe Mode Toggle -->
					<div class="timeframe-toggle">
						<button
							class="mode-btn"
							class:active={timeframeMode === 'cumulative'}
							onclick={() => (timeframeMode = 'cumulative')}
						>
							{t('wallet.timeframeCumulative')}
						</button>
						<button
							class="mode-btn"
							class:active={timeframeMode === 'daily'}
							onclick={() => (timeframeMode = 'daily')}
						>
							{t('wallet.timeframeDaily')}
						</button>
						<button
							class="mode-btn"
							class:active={timeframeMode === 'weekly'}
							onclick={() => (timeframeMode = 'weekly')}
						>
							{t('wallet.timeframeWeekly')}
						</button>
					</div>

					<!-- Flow by Timeframe -->
					<div class="flow-section">
						{#if timeframeMode === 'cumulative'}
							{@const periods = [
								{ label: '30d', stats: stats30d },
								{ label: '7d', stats: stats7d },
								{ label: '24h', stats: stats24h }
							]}
							{#each periods as { label, stats } (label)}
								<div class="flow-period">
									<span class="period-label">{label}</span>
									<div class="flow-values">
										<span class="flow-row in-value"
											><span class="num">+{formatCompact(stats.totalIn)}</span><span class="unit"
												>KRO</span
											></span
										>
										{#if stats.welfare > 0}
											<span class="flow-row welfare-value" title={t('wallet.welfareTooltip')}
												><span class="num">+{formatCompact(stats.welfare)}</span><span class="unit"
													>WELFARE</span
												></span
											>
										{/if}
										<span class="flow-row out-value"
											><span class="num">-{formatCompact(stats.totalOut)}</span><span class="unit"
												>KRO</span
											></span
										>
										<span class="flow-row net-value"
											><span class="num"
												>{stats.netChange >= 0 ? '+' : ''}{formatCompact(stats.netChange)}</span
											><span class="unit">NET</span></span
										>
									</div>
								</div>
							{/each}
						{:else if timeframeMode === 'daily'}
							{@const periods = [
								{ label: t('wallet.twoDaysAgo'), stats: statsDay2Ago },
								{ label: t('wallet.oneDayAgo'), stats: statsDay1Ago },
								{ label: t('wallet.last24h'), stats: statsLast24h }
							]}
							{#each periods as { label, stats } (label)}
								<div class="flow-period">
									<span class="period-label">{label}</span>
									<div class="flow-values">
										<span class="flow-row in-value"
											><span class="num">+{formatCompact(stats.totalIn)}</span><span class="unit"
												>KRO</span
											></span
										>
										{#if stats.welfare > 0}
											<span class="flow-row welfare-value" title={t('wallet.welfareTooltip')}
												><span class="num">+{formatCompact(stats.welfare)}</span><span class="unit"
													>WELFARE</span
												></span
											>
										{/if}
										<span class="flow-row out-value"
											><span class="num">-{formatCompact(stats.totalOut)}</span><span class="unit"
												>KRO</span
											></span
										>
										<span class="flow-row net-value"
											><span class="num"
												>{stats.netChange >= 0 ? '+' : ''}{formatCompact(stats.netChange)}</span
											><span class="unit">NET</span></span
										>
									</div>
								</div>
							{/each}
						{:else if timeframeMode === 'weekly'}
							{@const periods = [
								{ label: t('wallet.twoWeeksAgo'), stats: statsWeek2Ago },
								{ label: t('wallet.oneWeekAgo'), stats: statsWeek1Ago },
								{ label: t('wallet.lastWeek'), stats: statsLastWeek }
							]}
							{#each periods as { label, stats } (label)}
								<div class="flow-period">
									<span class="period-label">{label}</span>
									<div class="flow-values">
										<span class="flow-row in-value"
											><span class="num">+{formatCompact(stats.totalIn)}</span><span class="unit"
												>KRO</span
											></span
										>
										{#if stats.welfare > 0}
											<span class="flow-row welfare-value" title={t('wallet.welfareTooltip')}
												><span class="num">+{formatCompact(stats.welfare)}</span><span class="unit"
													>WELFARE</span
												></span
											>
										{/if}
										<span class="flow-row out-value"
											><span class="num">-{formatCompact(stats.totalOut)}</span><span class="unit"
												>KRO</span
											></span
										>
										<span class="flow-row net-value"
											><span class="num"
												>{stats.netChange >= 0 ? '+' : ''}{formatCompact(stats.netChange)}</span
											><span class="unit">NET</span></span
										>
									</div>
								</div>
							{/each}
						{/if}
					</div>

					<!-- Summary Stats -->
					<div class="summary-stats">
						<div class="summary-stat">
							<span class="summary-value">{allTimeStats.txCount.toLocaleString()}</span>
							<span class="summary-label">{t('wallet.totalTxCount')}</span>
						</div>
						<div class="summary-stat" title={t('wallet.contactsTooltip')}>
							<span class="summary-value">{uniqueAddresses.toLocaleString()}</span>
							<span class="summary-label">{t('wallet.uniqueAddresses')}</span>
						</div>
						<div class="summary-stat" title={t('wallet.avgTxTooltip')}>
							<span class="summary-value"
								><span class="num">{formatCompact(avgTxSize)}</span>
								<span class="unit-inline">KRO</span></span
							>
							<span class="summary-label">{t('wallet.avgTxSize')}</span>
						</div>
					</div>
				</div>
			{:else}
				<p class="expanded-placeholder">{t('wallet.noStatsAvailable')}</p>
			{/if}
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
		gap: 0.5rem;
	}

	.reorder-controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.375rem;
		padding: 0.125rem;
	}

	.move-btn {
		background: transparent;
		border: none;
		color: var(--text-color-2);
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		transition:
			color 0.15s ease,
			background 0.15s ease;
		border-radius: 0.25rem;
	}

	/* Hide move up/down buttons on larger screens where wallets display in multiple columns */
	@media only screen and (min-width: 769px) {
		.move-btn {
			display: none;
		}
	}

	.move-btn:hover:not(:disabled) {
		color: var(--text-color-1);
		background: rgba(255, 255, 255, 0.1);
	}

	.move-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.drag-handle {
		color: var(--text-color-2);
		cursor: grab;
		padding: 0.25rem 0.375rem;
		opacity: 0.6;
		transition:
			opacity 0.15s ease,
			color 0.15s ease;
	}

	.drag-handle:hover {
		opacity: 1;
		color: var(--text-color-1);
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

	.expand-toggle .toggle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s ease;
	}

	.expand-toggle.expanded .toggle-icon {
		transform: rotate(180deg);
	}

	.expand-toggle .toggle-text {
		transition: opacity 0.2s ease;
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

	.loading-stats {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		color: var(--text-color-2);
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: var(--theme-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.expanded-stats {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.timeframe-toggle {
		display: flex;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		padding: 0.25rem;
		gap: 0.25rem;
	}

	.mode-btn {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--text-color-2);
		padding: 0.4rem 0.5rem;
		border-radius: 0.35rem;
		font-size: 0.7rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.mode-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-color);
	}

	.mode-btn.active {
		background: rgba(var(--theme-color-rgb), 0.25);
		color: rgb(var(--theme-color-rgb));
	}

	.flow-section {
		display: flex;
		gap: 0.5rem;
		overflow: hidden;
	}

	.flow-period {
		flex: 1;
		min-width: 0;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		padding: 0.75rem 0.25rem;
		text-align: center;
	}

	.period-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-color-2);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.flow-values {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.flow-row {
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 0.15rem;
	}

	.flow-row .num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
	}

	.flow-row .unit {
		text-align: left;
		font-size: 0.55rem;
		opacity: 0.7;
	}

	.in-value {
		color: #51cf66;
		font-weight: 500;
	}

	.welfare-value {
		color: #fcc419;
		font-weight: 500;
		cursor: help;
	}

	.out-value {
		color: #ff6b6b;
		font-weight: 500;
	}

	.net-value {
		color: rgb(var(--theme-color-rgb));
		font-weight: 600;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-top: 0.25rem;
		margin-top: 0.25rem;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.summary-stat {
		text-align: center;
	}

	.summary-value {
		display: block;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-color-1);
	}

	.summary-value small {
		font-size: 0.7rem;
		color: var(--text-color-2);
		font-weight: 400;
	}

	.summary-value .unit-inline {
		font-size: 0.7rem;
		color: var(--text-color-2);
		font-weight: 400;
	}

	.summary-label {
		display: block;
		font-size: 0.7rem;
		color: var(--text-color-2);
		margin-top: 0.125rem;
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
