<script lang="ts">
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import type { NamesResponse } from 'kromer';
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

	let loading: boolean = $state(true);
	let totalNames: number = $state(0);
	let recentRegistrations: number = $state(0);
	let recentTransfers: number = $state(0);

	$effect(() => {
		if (browser) {
			loading = true;

			// Get total count and recent names
			kromer.names
				.getAll({ limit: 100 })
				.then((result: NamesResponse) => {
					totalNames = result.total;

					const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

					recentRegistrations = result.names.filter(
						(name) => name.registered && new Date(name.registered) > oneWeekAgo
					).length;

					recentTransfers = result.names.filter(
						(name) => name.transferred && new Date(name.transferred) > oneWeekAgo
					).length;

					loading = false;
				})
				.catch(console.error);
		}
	});
</script>

<div
	class="col-{lgCols} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''} name-stats-container"
>
	<!-- All-Time Statistics -->
	<div class="stats-group">
		<div class="stats-group-header">
			<span class="stats-group-label">{$t$('stats.allTime')}</span>
		</div>
		<div class="stats-group-content">
			<div class="statistic">
				<h2>{$t$('stats.totalNames')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{totalNames.toLocaleString()}
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.registeredNames')}</div>
			</div>
		</div>
	</div>

	<!-- This Week Statistics -->
	<div class="stats-group period-stats">
		<div class="stats-group-header">
			<span class="stats-group-label">{$t$('stats.lastWeek')}</span>
		</div>
		<div class="stats-group-content">
			<div class="statistic">
				<h2>{$t$('stats.recentRegistrations')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{recentRegistrations.toLocaleString()}
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.newNamesRegistered')}</div>
			</div>
			<div class="statistic">
				<h2>{$t$('stats.recentNameTransfers')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{recentTransfers.toLocaleString()}
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.nameOwnershipChanges')}</div>
			</div>
		</div>
	</div>
</div>

<style>
	.name-stats-container {
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
		min-width: 180px;
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
		min-width: 100px;
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
		.name-stats-container {
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
