<script lang="ts">
	import shopsync from '$lib/stores/shopsync';
	import type { Shop } from '$lib/types/shops';
	import { onMount } from 'svelte';
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
	let shops: Shop[] = $state([]);

	let totalShops = $derived(shops.length);
	let totalListings = $derived(shops.reduce((sum, shop) => sum + (shop.items?.length ?? 0), 0));
	let totalStock = $derived(
		shops.reduce((sum, shop) => sum + (shop.items?.reduce((s, item) => s + item.stock, 0) ?? 0), 0)
	);
	let uniqueOwners = $derived(new Set(shops.map((shop) => shop.owner).filter(Boolean)).size);

	onMount(() => {
		shopsync.subscribe((data) => {
			shops = data.data;
			loading = data.data.length === 0;
		});
	});
</script>

<div
	class="col-{lgCols} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''} shop-stats-container"
>
	<!-- Shop Overview -->
	<div class="stats-group">
		<div class="stats-group-header">
			<span class="stats-group-label">{$t$('stats.shopOverview')}</span>
		</div>
		<div class="stats-group-content">
			<div class="statistic">
				<h2>{$t$('stats.totalShops')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{totalShops.toLocaleString()}
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.activeShops')}</div>
			</div>
			<div class="statistic">
				<h2>{$t$('stats.uniqueOwners')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{uniqueOwners.toLocaleString()}
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.shopOwners')}</div>
			</div>
		</div>
	</div>

	<!-- Inventory Statistics -->
	<div class="stats-group period-stats">
		<div class="stats-group-header">
			<span class="stats-group-label">{$t$('stats.inventory')}</span>
		</div>
		<div class="stats-group-content">
			<div class="statistic">
				<h2>{$t$('stats.totalListings')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{totalListings.toLocaleString()}
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.uniqueItems')}</div>
			</div>
			<div class="statistic">
				<h2>{$t$('stats.totalStock')}</h2>
				<div class="stat-value">
					{#if loading}
						<span class="loading">
							<span class="loading-spinner"></span>
						</span>
					{:else}
						{totalStock.toLocaleString()}
					{/if}
				</div>
				<div class="stat-subtitle">{$t$('stats.itemsAvailable')}</div>
			</div>
		</div>
	</div>
</div>

<style>
	.shop-stats-container {
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
		min-width: 200px;
	}

	.stats-group.period-stats {
		flex: 1;
		min-width: 250px;
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
		.shop-stats-container {
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
