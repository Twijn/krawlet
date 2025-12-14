<script lang="ts">
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import { formatCurrency } from '$lib/util';
	import type { Transaction, TransactionsResponse } from 'kromer';
	import { t$ } from '$lib/i18n';
	import { paramState } from '$lib/paramState.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;
	type TimeFrame = '1h' | '1d' | '1w' | '1m';

	const TIMEFRAME_MS: Record<TimeFrame, number> = {
		'1h': 60 * 60 * 1000,
		'1d': 24 * 60 * 60 * 1000,
		'1w': 7 * 24 * 60 * 60 * 1000,
		'1m': 30 * 24 * 60 * 60 * 1000
	};

	const TIMEFRAME_LABELS: Record<TimeFrame, string> = {
		'1h': '1H',
		'1d': '1D',
		'1w': '1W',
		'1m': '1M'
	};

	const TIMEFRAME_DESCRIPTIONS: Record<TimeFrame, string> = {
		'1h': 'stats.lastHour',
		'1d': 'stats.last24Hours',
		'1w': 'stats.lastWeek',
		'1m': 'stats.lastMonth'
	};

	const TIMEFRAME_COMPARISON: Record<TimeFrame, string> = {
		'1h': 'stats.vsPreviousHour',
		'1d': 'stats.vsPrevious24Hours',
		'1w': 'stats.vsPreviousWeek',
		'1m': 'stats.vsPreviousMonth'
	};

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let timeframe = paramState<TimeFrame>('tf', '1d', {
		shouldSet: (v) => v !== '1d' && ['1h', '1d', '1w', '1m'].includes(v)
	});

	let loading: boolean = $state(true);
	let loadingStatus: string = $state('stats.loadingTransactions');
	let totalTransactions: number = $state(0);
	let currentVolume: number = $state(0);
	let previousVolume: number = $state(0);
	let currentCount: number = $state(0);
	let previousCount: number = $state(0);

	async function fetchAllTransactionsInRange(
		startTime: number,
		endTime: number
	): Promise<Transaction[]> {
		const allTxs: Transaction[] = [];
		let offset = 0;
		const limit = 100;
		let keepFetching = true;

		while (keepFetching) {
			const resp = await kromer.transactions.getLatest({ offset, limit, excludeMined: true });

			for (const tx of resp.transactions) {
				const txTime = tx.time.getTime();
				if (txTime >= startTime && txTime < endTime) {
					allTxs.push(tx);
				}
				// If we've gone past our start time, we can stop
				if (txTime < startTime) {
					keepFetching = false;
					break;
				}
			}

			// If we got fewer than limit, we've reached the end
			if (resp.transactions.length < limit) {
				keepFetching = false;
			} else {
				offset += limit;
			}
		}

		return allTxs;
	}

	$effect(() => {
		if (browser) {
			loading = true;
			loadingStatus = 'stats.loadingTransactions';
			const tf = timeframe.value;
			const now = Date.now();
			const periodMs = TIMEFRAME_MS[tf];
			const currentStart = now - periodMs;
			const previousStart = now - periodMs * 2;
			const previousEnd = currentStart;

			// Get total count
			kromer.transactions
				.getLatest({ limit: 1, excludeMined: true })
				.then((result: TransactionsResponse) => {
					totalTransactions = result.total;
				})
				.catch(console.error);

			// Fetch transactions for current and previous periods
			loadingStatus = 'stats.analyzingPeriod';
			Promise.all([
				fetchAllTransactionsInRange(currentStart, now),
				fetchAllTransactionsInRange(previousStart, previousEnd)
			])
				.then(([currentTxs, previousTxs]) => {
					loadingStatus = 'stats.calculatingStats';
					currentVolume = currentTxs.reduce((sum, tx) => sum + tx.value, 0);
					previousVolume = previousTxs.reduce((sum, tx) => sum + tx.value, 0);
					currentCount = currentTxs.length;
					previousCount = previousTxs.length;
					loading = false;
				})
				.catch(console.error);
		}
	});

	let volumeChange = $derived(
		previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0
	);

	let countChange = $derived(
		previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0
	);

	let comparisonLabel = $derived($t$(TIMEFRAME_COMPARISON[timeframe.value]));
</script>

<div
	class="col-{lgCols} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''} statistics"
>
	<div class="statistic">
		<h2>{$t$('stats.totalTransactions')}</h2>
		<div>
			{#if loading}
				<span class="loading" title={$t$(loadingStatus)}>
					<span class="loading-spinner"></span>
				</span>
			{:else}
				{totalTransactions.toLocaleString()}
			{/if}
		</div>
	</div>
	<div class="statistic">
		<h2>{$t$('stats.volumeInPeriod')}</h2>
		<div>
			{#if loading}
				<span class="loading" title={$t$(loadingStatus)}>
					<span class="loading-spinner"></span>
				</span>
			{:else}
				{formatCurrency(currentVolume)} <small>KRO</small>
				{#if previousVolume > 0}
					<span
						class="change"
						class:positive={volumeChange > 0}
						class:negative={volumeChange < 0}
						title={comparisonLabel}
					>
						{volumeChange > 0 ? '+' : ''}{volumeChange.toFixed(1)}%
					</span>
				{/if}
			{/if}
		</div>
	</div>
	<div class="statistic mobile-hide">
		<h2>{$t$('stats.transactionsInPeriod')}</h2>
		<div>
			{#if loading}
				<span class="loading" title={$t$(loadingStatus)}>
					<span class="loading-spinner"></span>
				</span>
			{:else}
				{currentCount.toLocaleString()}
				{#if previousCount > 0}
					<span
						class="change"
						class:positive={countChange > 0}
						class:negative={countChange < 0}
						title={comparisonLabel}
					>
						{countChange > 0 ? '+' : ''}{countChange.toFixed(1)}%
					</span>
				{/if}
			{/if}
		</div>
	</div>
	<div class="statistic timeframe-stat">
		<div class="timeframe-selector">
			{#each Object.entries(TIMEFRAME_LABELS) as [key, label] (key)}
				<button
					class:active={timeframe.value === key}
					onclick={() => (timeframe.value = key as TimeFrame)}
					title={$t$(TIMEFRAME_DESCRIPTIONS[key as TimeFrame])}
				>
					{label}
				</button>
			{/each}
		</div>
		<div class="timeframe-description">
			{$t$(TIMEFRAME_DESCRIPTIONS[timeframe.value])}
		</div>
	</div>
</div>

<style>
	.loading {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		opacity: 0.7;
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: var(--theme-color-1);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.timeframe-stat {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-end;
		margin-left: auto;
	}

	.timeframe-selector {
		display: flex;
		gap: 0;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.timeframe-selector button {
		background: rgba(255, 255, 255, 0.05);
		border: none;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--text-color-2);
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		transition: all 0.15s ease;
	}

	.timeframe-selector button:last-child {
		border-right: none;
	}

	.timeframe-selector button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-color-1);
	}

	.timeframe-selector button.active {
		background: var(--theme-color-1);
		color: var(--text-color-1);
	}

	.timeframe-description {
		font-size: 0.75rem;
		color: var(--text-color-2);
		margin-top: 0.5rem;
		text-align: center;
	}

	.change {
		display: inline-block;
		font-size: 0.65em;
		margin-left: 0.5rem;
		padding: 0.15rem 0.4rem;
		border-radius: 0.25rem;
		font-weight: 600;
		vertical-align: middle;
	}

	.change.positive {
		background: rgba(var(--green), 0.2);
		color: rgb(var(--green));
	}

	.change.negative {
		background: rgba(var(--red), 0.2);
		color: rgb(var(--red));
	}
</style>
