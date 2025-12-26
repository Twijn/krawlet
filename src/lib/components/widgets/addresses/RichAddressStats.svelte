<script lang="ts">
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import { formatCurrency } from '$lib/util';
	import type { AddressesResponse } from 'kromer';
	import { t$ } from '$lib/i18n';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	const SERVERWELF_ADDRESS = 'serverwelf';

	let loading: boolean = $state(true);
	let totalAddresses: number = $state(0);
	let top10Balance: number = $state(0);
	let totalSupply: number = $state(0);

	$effect(() => {
		if (browser) {
			loading = true;

			// Get total addresses count
			kromer.addresses
				.getAll({ limit: 1 })
				.then((result: AddressesResponse) => {
					totalAddresses = result.total;
				})
				.catch(console.error);

			// Get supply from API
			kromer
				.getSupply()
				.then((supply: number) => {
					totalSupply = supply;
				})
				.catch(console.error);

			// Get top richest addresses (excluding serverwelf) for wealth distribution
			kromer.addresses
				.getRich({ limit: 15 })
				.then((result: AddressesResponse) => {
					const filtered = result.addresses.filter((addr) => addr.address !== SERVERWELF_ADDRESS);
					top10Balance = filtered.slice(0, 10).reduce((sum, addr) => sum + addr.balance, 0);
					loading = false;
				})
				.catch(console.error);
		}
	});

	let top10Percentage_derived = $derived(totalSupply > 0 ? (top10Balance / totalSupply) * 100 : 0);
</script>

<div
	class="col-{lgCols} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''} address-stats-container"
>
	<!-- Network Overview -->
	<div class="stats-group">
		<div class="stats-group-header">
			<span class="stats-group-label">{$t$('stats.networkOverview')}</span>
		</div>
		<div class="stats-group-content">
			<div class="statistic">
				<h2>{$t$('stats.totalAddresses')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{totalAddresses.toLocaleString()}
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.uniqueAddresses')}</div>
			</div>
			<div class="statistic">
				<h2>{$t$('stats.totalSupply')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{formatCurrency(totalSupply)} <small>KRO</small>
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.circulatingSupply')}</div>
			</div>
		</div>
	</div>

	<!-- Wealth Distribution -->
	<div class="stats-group period-stats">
		<div class="stats-group-header">
			<span class="stats-group-label">{$t$('stats.wealthDistribution')}</span>
		</div>
		<div class="stats-group-content">
			<div class="statistic">
				<h2>{$t$('stats.top10Wealth')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{formatCurrency(top10Balance)} <small>KRO</small>
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.excludingWelfare')}</div>
			</div>
			<div class="statistic">
				<h2>{$t$('stats.wealthConcentration')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{top10Percentage_derived.toFixed(1)}<small>%</small>
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.ofTotalSupply')}</div>
			</div>
		</div>
	</div>
</div>

<style>
	.address-stats-container {
		display: flex;
		gap: 1.5rem;
		margin: 0.5em 0 1.5em 0;
		flex-wrap: wrap;
	}

	.stats-group {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		min-width: 220px;
	}

	.stats-group.period-stats {
		flex: 1;
		min-width: 280px;
	}

	.stats-group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.stats-group-label {
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--theme-color-1);
		letter-spacing: 0.05em;
	}

	.stats-group-content {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.statistic {
		min-width: 120px;
	}

	.statistic h2 {
		color: var(--text-color-2);
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		margin: 0;
		letter-spacing: 0.02em;
	}

	.stat-value {
		margin-top: 0.35rem;
		font-size: 1.5em;
		font-weight: 600;
		color: var(--text-color-1);
	}

	.stat-subtitle {
		font-size: 0.7rem;
		color: var(--text-color-2);
		margin-top: 0.25rem;
		opacity: 0.8;
	}

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

	@media only screen and (max-width: 700px) {
		.address-stats-container {
			flex-direction: column;
		}

		.stats-group.period-stats {
			min-width: unset;
		}

		.stats-group-content {
			gap: 1.5rem;
		}
	}
</style>
