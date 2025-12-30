<script lang="ts">
	import { browser } from '$app/environment';
	import { paramState } from '$lib/paramState.svelte';
	import { t$ } from '$lib/i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faChartBar,
		faExclamationTriangle,
		faCheckCircle,
		faStore,
		faCubes
	} from '@fortawesome/free-solid-svg-icons';

	import ReportsStats from '$lib/components/widgets/reports/ReportsStats.svelte';
	import ValidationFailures from '$lib/components/widgets/reports/ValidationFailures.svelte';
	import SuccessfulPosts from '$lib/components/widgets/reports/SuccessfulPosts.svelte';
	import ShopChanges from '$lib/components/widgets/reports/ShopChanges.svelte';
	import ItemPropertyChanges from '$lib/components/widgets/reports/ItemPropertyChanges.svelte';

	type TabId = 'stats' | 'validation' | 'posts' | 'shops' | 'items';

	const tabs: { id: TabId; icon: typeof faChartBar; labelKey: string }[] = [
		{ id: 'stats', icon: faChartBar, labelKey: 'reports.statsTitle' },
		{ id: 'validation', icon: faExclamationTriangle, labelKey: 'reports.validationFailures' },
		{ id: 'posts', icon: faCheckCircle, labelKey: 'reports.successfulPosts' },
		{ id: 'shops', icon: faStore, labelKey: 'reports.shopChanges' },
		{ id: 'items', icon: faCubes, labelKey: 'reports.itemChanges' }
	];

	let activeTab = paramState<TabId>('tab', 'stats', {
		shouldSet: (value) => value !== 'stats' && tabs.some((t) => t.id === value)
	});
</script>

<svelte:head>
	<title>{$t$('nav.reports')} | Shops | Krawlet</title>
</svelte:head>

<div class="col-12">
	<h1>
		<a href="/">Krawlet</a> <span>&raquo;</span>
		<a href="/shops">{$t$('nav.shops')}</a> <span>&raquo;</span>
		<a href="/shops/reports">{$t$('nav.reports')}</a>
	</h1>

	<div class="tabs-nav" role="tablist" aria-label="Report categories">
		{#each tabs as tab (tab.id)}
			<button
				role="tab"
				aria-selected={activeTab.value === tab.id}
				aria-controls="panel-{tab.id}"
				class:active={activeTab.value === tab.id}
				onclick={() => (activeTab.value = tab.id)}
			>
				<FontAwesomeIcon icon={tab.icon} />
				<span class="tab-label">{$t$(tab.labelKey)}</span>
			</button>
		{/each}
	</div>

	<div class="tab-content">
		{#if activeTab.value === 'stats'}
			<div id="panel-stats" role="tabpanel">
				<ReportsStats lgCols={12} />
			</div>
		{:else if activeTab.value === 'validation'}
			<div id="panel-validation" role="tabpanel">
				<ValidationFailures lgCols={12} limit={25} />
			</div>
		{:else if activeTab.value === 'posts'}
			<div id="panel-posts" role="tabpanel">
				<SuccessfulPosts lgCols={12} limit={25} />
			</div>
		{:else if activeTab.value === 'shops'}
			<div id="panel-shops" role="tabpanel">
				<ShopChanges lgCols={12} limit={25} />
			</div>
		{:else if activeTab.value === 'items'}
			<div id="panel-items" role="tabpanel">
				<ItemPropertyChanges lgCols={12} limit={25} />
			</div>
		{/if}
	</div>
</div>

<style>
	.tabs-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
		margin-bottom: 1.5rem;
		padding: 0.5rem;
		background-color: var(--background-color-2);
		border-radius: 0.5rem;
	}

	.tabs-nav button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		background-color: transparent;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		color: var(--text-color-2);
		font-family: var(--font-family);
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			background-color 0.2s,
			color 0.2s,
			border-color 0.2s;
	}

	.tabs-nav button:hover {
		background-color: rgba(255, 255, 255, 0.05);
		color: var(--text-color-1);
	}

	.tabs-nav button.active {
		background-color: var(--theme-color-1);
		color: white;
		border-color: var(--theme-color-1);
	}

	.tab-label {
		display: inline;
	}

	@media only screen and (max-width: 768px) {
		.tabs-nav {
			gap: 0.25rem;
			padding: 0.25rem;
		}

		.tabs-nav button {
			padding: 0.5rem 0.75rem;
			font-size: 0.8rem;
		}

		.tab-label {
			display: none;
		}
	}

	.tab-content {
		min-height: 400px;
	}
</style>
