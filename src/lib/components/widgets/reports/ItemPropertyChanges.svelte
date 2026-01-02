<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faHistory, faArrowUp, faArrowDown, faExchange, faPlus, faMinus, faDatabase, faMemory, faFilter } from '@fortawesome/free-solid-svg-icons';
	import { getItemChanges, getPriceChanges } from '$lib/api/shopsync-reports';
	import type { 
		ItemChangeRecord, 
		ItemChangesResponse, 
		ItemSummary, 
		ItemUpdateSummary,
		PriceChangeLog,
		PriceChangesResponse 
	} from '$lib/types/shopsync-reports';
	import { relativeTime } from '$lib/util';
	import { paramState } from '$lib/paramState.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { t$ } from '$lib/i18n';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;
	type DataSource = 'memory' | 'persistent';
	type ChangeType = 'all' | 'added' | 'removed' | 'updated';

	function getItemImageUrlFromName(itemName: string): string {
		return `https://shops.alexdevs.me/assets/items/${itemName.replace(':', '/')}.png`;
	}

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		limit = 25,
		defaultSource = 'persistent'
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		limit?: number;
		defaultSource?: DataSource;
	} = $props();

	let page = paramState('ipc_page', 1, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => value >= 2
	});

	let source = paramState<DataSource>('ipc_src', defaultSource, {
		shouldSet: (value) => value !== defaultSource && (value === 'memory' || value === 'persistent')
	});

	let changeFilter = paramState<ChangeType>('ipc_type', 'all', {
		shouldSet: (value) => value !== 'all' && ['added', 'removed', 'updated'].includes(value)
	});

	let loading: boolean = $state(true);
	let error: string | null = $state(null);
	
	// Data from both sources
	let memoryData: ItemChangesResponse | null = $state(null);
	let persistentData: PriceChangesResponse | null = $state(null);

	// Unified row type for display
	type UnifiedChange = {
		id: string;
		timestamp: Date;
		shopId: string;
		shopName: string;
		itemName: string;
		itemDisplayName: string;
		changeType: 'added' | 'removed' | 'updated';
		field?: string;
		previousValue?: unknown;
		newValue?: unknown;
		changes?: Array<{ field: string; previousValue: unknown; newValue: unknown }>;
	};

	// Convert memory data to unified format
	let memoryChanges = $derived.by((): UnifiedChange[] => {
		if (!memoryData?.ok) return [];
		const changes: UnifiedChange[] = [];
		
		for (const event of memoryData.recent) {
			for (const item of event.added) {
				changes.push({
					id: `${event.id}-add-${item.hash}`,
					timestamp: new Date(event.timestamp),
					shopId: event.shopId,
					shopName: event.shopName,
					itemName: item.name,
					itemDisplayName: item.displayName,
					changeType: 'added'
				});
			}
			for (const item of event.removed) {
				changes.push({
					id: `${event.id}-rem-${item.hash}`,
					timestamp: new Date(event.timestamp),
					shopId: event.shopId,
					shopName: event.shopName,
					itemName: item.name,
					itemDisplayName: item.displayName,
					changeType: 'removed'
				});
			}
			for (const item of event.updated) {
				changes.push({
					id: `${event.id}-upd-${item.hash}`,
					timestamp: new Date(event.timestamp),
					shopId: event.shopId,
					shopName: event.shopName,
					itemName: item.name,
					itemDisplayName: item.displayName,
					changeType: 'updated',
					changes: item.changes
				});
			}
		}
		
		return changes;
	});

	// Convert persistent data to unified format
	let persistentChanges = $derived.by((): UnifiedChange[] => {
		if (!persistentData?.ok) return [];
		
		return persistentData.data.map((record): UnifiedChange => ({
			id: `p-${record.id}`,
			timestamp: new Date(record.createdAt),
			shopId: record.shopId,
			shopName: record.shopName,
			itemName: record.itemName,
			itemDisplayName: record.itemDisplayName,
			changeType: 'updated',
			field: record.field,
			previousValue: parseJsonValue(record.previousValue),
			newValue: parseJsonValue(record.newValue)
		}));
	});

	// Active data based on source selection
	let activeChanges = $derived.by((): UnifiedChange[] => {
		const changes = source.value === 'memory' ? memoryChanges : persistentChanges;
		
		if (changeFilter.value === 'all') return changes;
		return changes.filter(c => c.changeType === changeFilter.value);
	});

	let totalChanges = $derived(activeChanges.length);
	// For memory data, use client-side pagination. For persistent data, use server-paginated data directly.
	let paginatedChanges = $derived(
		source.value === 'persistent' 
			? activeChanges 
			: activeChanges.slice((page.value - 1) * limit, page.value * limit)
	);

	// For persistent data, we need server-side pagination
	let persistentOffset = $derived((page.value - 1) * limit);
	let persistentTotal = $derived.by(() => {
		if (!persistentData?.ok) return 0;
		return persistentData.total;
	});

	async function fetchMemoryData() {
		const result = await getItemChanges({ limit: 500 });
		if (result.ok) {
			memoryData = result as ItemChangesResponse;
		} else {
			throw new Error('error' in result ? (result.message ?? result.error) : 'Failed to fetch');
		}
	}

	async function fetchPersistentData() {
		const result = await getPriceChanges({ limit, offset: persistentOffset });
		if (result.ok) {
			persistentData = result as PriceChangesResponse;
		} else {
			throw new Error('error' in result ? (result.message ?? result.error) : 'Failed to fetch');
		}
	}

	async function fetchData() {
		if (!browser) return;
		
		loading = true;
		error = null;
		
		try {
			if (source.value === 'memory') {
				await fetchMemoryData();
			} else {
				await fetchPersistentData();
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch data';
		}
		
		loading = false;
	}

	// Refetch when source changes, or when page changes for persistent data
	$effect(() => {
		if (browser) {
			const currentSource = source.value;
			const currentPage = page.value;
			fetchData();
		}
	});

	onMount(() => {
		fetchData();
	});

	function parseJsonValue(value: string | null): unknown {
		if (value === null) return null;
		try {
			return JSON.parse(value);
		} catch {
			return value;
		}
	}

	function formatChangeValue(value: unknown): string {
		if (value === null || value === undefined) return '—';
		if (typeof value === 'boolean') return value ? 'Yes' : 'No';
		if (typeof value === 'number') return value.toLocaleString();
		return String(value);
	}

	function getChangeIcon(changeType: 'added' | 'removed' | 'updated') {
		switch (changeType) {
			case 'added': return faPlus;
			case 'removed': return faMinus;
			case 'updated': return faExchange;
		}
	}

	function getChangeClass(changeType: 'added' | 'removed' | 'updated') {
		switch (changeType) {
			case 'added': return 'change-added';
			case 'removed': return 'change-removed';
			case 'updated': return 'change-updated';
		}
	}

	function getValueChangeIcon(prev: unknown, next: unknown) {
		if (typeof prev === 'number' && typeof next === 'number') {
			return next > prev ? faArrowUp : faArrowDown;
		}
		return faExchange;
	}

	function getValueChangeClass(prev: unknown, next: unknown) {
		if (typeof prev === 'number' && typeof next === 'number') {
			return next > prev ? 'value-up' : 'value-down';
		}
		return '';
	}

	function handleSourceChange(newSource: DataSource) {
		if (source.value !== newSource) {
			page.value = 1;
			source.value = newSource;
		}
	}

	function handleFilterChange(newFilter: ChangeType) {
		if (changeFilter.value !== newFilter) {
			page.value = 1;
			changeFilter.value = newFilter;
		}
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faHistory} /> {$t$('reports.itemChanges')}</h2>
	
	<div class="controls">
		<div class="control-group">
			<span class="control-label">{$t$('reports.dataSource')}:</span>
			<div class="button-group">
				<button 
					class:active={source.value === 'persistent'} 
					onclick={() => handleSourceChange('persistent')}
					title={$t$('reports.persistentDesc')}
				>
					<FontAwesomeIcon icon={faDatabase} />
					{$t$('reports.persistent')}
				</button>
				<button 
					class:active={source.value === 'memory'} 
					onclick={() => handleSourceChange('memory')}
					title={$t$('reports.memoryDesc')}
				>
					<FontAwesomeIcon icon={faMemory} />
					{$t$('reports.memory')}
				</button>
			</div>
		</div>

		{#if source.value === 'memory'}
			<div class="control-group">
				<span class="control-label"><FontAwesomeIcon icon={faFilter} /></span>
				<div class="button-group">
					<button 
						class:active={changeFilter.value === 'all'} 
						onclick={() => handleFilterChange('all')}
					>
						{$t$('reports.all')}
					</button>
					<button 
						class:active={changeFilter.value === 'added'} 
						onclick={() => handleFilterChange('added')}
					>
						<FontAwesomeIcon icon={faPlus} />
						{$t$('reports.added')}
					</button>
					<button 
						class:active={changeFilter.value === 'removed'} 
						onclick={() => handleFilterChange('removed')}
					>
						<FontAwesomeIcon icon={faMinus} />
						{$t$('reports.removed')}
					</button>
					<button 
						class:active={changeFilter.value === 'updated'} 
						onclick={() => handleFilterChange('updated')}
					>
						<FontAwesomeIcon icon={faExchange} />
						{$t$('reports.updated')}
					</button>
				</div>
			</div>
		{/if}
	</div>

	{#if error}
		<div class="error-message">
			<p>{error}</p>
			<button onclick={fetchData}>{$t$('common.retry')}</button>
		</div>
	{:else if loading}
		<ModuleLoading>
			<SkeletonTable rows={10} columns={5} />
		</ModuleLoading>
	{:else if paginatedChanges.length > 0}
		<Pagination 
			bind:page={page.value} 
			total={source.value === 'persistent' ? persistentTotal : totalChanges} 
			{limit} 
		/>
		
		<div class="table-container">
			<table>
				<thead>
					<tr>
						{#if source.value === 'memory'}
							<th>{$t$('reports.changeType')}</th>
						{/if}
						<th>{$t$('shop.item')}</th>
						<th>{$t$('shop.shop')}</th>
						<th>{$t$('reports.changes')}</th>
						<th class="right">{$t$('transaction.time')}</th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedChanges as change (change.id)}
						<tr>
							{#if source.value === 'memory'}
								<td>
									<span class="change-badge {getChangeClass(change.changeType)}">
										<FontAwesomeIcon icon={getChangeIcon(change.changeType)} />
										{$t$(`reports.${change.changeType}`)}
									</span>
								</td>
							{/if}
							<td class="item-cell">
								<img 
									src={getItemImageUrlFromName(change.itemName)} 
									alt={change.itemDisplayName}
									class="item-icon"
								/>
								<div class="item-info">
									<span class="item-name">{change.itemDisplayName}</span>
									<small class="item-id">{change.itemName}</small>
								</div>
							</td>
							<td>
								<a href="/shops/{change.shopId}">{change.shopName}</a>
							</td>
							<td class="changes-cell">
								{#if change.changeType === 'added'}
									<span class="change-desc">{$t$('reports.itemAdded')}</span>
								{:else if change.changeType === 'removed'}
									<span class="change-desc">{$t$('reports.itemRemoved')}</span>
								{:else if change.field}
									<!-- Single field change (persistent) -->
									<div class="field-change {getValueChangeClass(change.previousValue, change.newValue)}">
										<span class="field-name">{change.field}:</span>
										<span class="field-prev">{formatChangeValue(change.previousValue)}</span>
										<FontAwesomeIcon icon={getValueChangeIcon(change.previousValue, change.newValue)} />
										<span class="field-new">{formatChangeValue(change.newValue)}</span>
									</div>
								{:else if change.changes && change.changes.length > 0}
									<!-- Multiple field changes (memory) -->
									<div class="changes-list">
										{#each change.changes as fieldChange (fieldChange.field)}
											<div class="field-change {getValueChangeClass(fieldChange.previousValue, fieldChange.newValue)}">
												<span class="field-name">{fieldChange.field}:</span>
												<span class="field-prev">{formatChangeValue(fieldChange.previousValue)}</span>
												<FontAwesomeIcon icon={getValueChangeIcon(fieldChange.previousValue, fieldChange.newValue)} />
												<span class="field-new">{formatChangeValue(fieldChange.newValue)}</span>
											</div>
										{/each}
									</div>
								{:else}
									<span class="change-desc">{$t$('reports.propertyUpdated')}</span>
								{/if}
							</td>
							<td class="right time" title={change.timestamp.toLocaleString()}>
								{relativeTime(change.timestamp)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		
		<Pagination 
			bind:page={page.value} 
			total={source.value === 'persistent' ? persistentTotal : totalChanges} 
			{limit} 
		/>
	{:else}
		<p class="no-data">{$t$('reports.noChanges')}</p>
	{/if}
</Section>

<style>
	/* Filter Controls */
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.25rem;
		margin-bottom: 1.25rem;
		padding: 0.75rem 1rem;
		background: linear-gradient(135deg, var(--background-color-2) 0%, rgba(var(--theme-color-rgb), 0.08) 100%);
		border-radius: 0.75rem;
		border: 1px solid rgba(var(--theme-color-rgb), 0.2);
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.control-label {
		font-size: 0.75em;
		font-weight: 600;
		color: var(--text-color-2);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.button-group {
		display: flex;
		gap: 2px;
		background-color: rgba(0, 0, 0, 0.2);
		padding: 3px;
		border-radius: 0.5rem;
	}

	.button-group button {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.85rem;
		background-color: transparent;
		border: none;
		border-radius: 0.4rem;
		color: var(--text-color-2);
		font-family: var(--font-family);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.button-group button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		color: var(--text-color-1);
	}

	.button-group button.active {
		background-color: var(--theme-color-1);
		color: white;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
	}

	/* Status States */
	.error-message {
		text-align: center;
		padding: 2.5em 2em;
		background-color: rgba(var(--red), 0.08);
		border-radius: 0.5rem;
		border: 1px solid rgba(var(--red), 0.2);
	}

	.error-message p {
		color: rgb(var(--red));
		font-weight: 500;
		margin-bottom: 1em;
	}

	.error-message button {
		padding: 0.5em 1.25em;
		background-color: var(--theme-color-1);
		color: white;
		border: none;
		border-radius: 0.35em;
		font-weight: 500;
		cursor: pointer;
	}

	.error-message button:hover {
		opacity: 0.9;
	}

	.no-data {
		text-align: center;
		color: var(--text-color-2);
		padding: 2.5em;
		background-color: var(--background-color-2);
		border-radius: 0.5rem;
	}

	/* Change Badges */
	.change-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.3em 0.65em;
		border-radius: 1.5em;
		font-size: 0.75em;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.change-added {
		background-color: rgba(var(--green), 0.15);
		color: rgb(var(--green));
	}

	.change-removed {
		background-color: rgba(var(--red), 0.15);
		color: rgb(var(--red));
	}

	.change-updated {
		background-color: rgba(var(--blue), 0.15);
		color: rgb(var(--blue));
	}

	/* Item Cell */
	.item-cell {
		display: flex;
		align-items: center;
		gap: 0.6em;
	}

	.item-icon {
		width: 36px;
		height: 36px;
		image-rendering: pixelated;
		background-color: var(--background-color-2);
		border-radius: 0.3em;
		padding: 3px;
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 0.1em;
		min-width: 0;
	}

	.item-name {
		font-weight: 500;
		color: var(--text-color-1);
	}

	.item-id {
		color: var(--text-color-2);
		font-size: 0.75em;
		font-family: monospace;
	}

	/* Changes Display */
	.changes-cell {
		max-width: 320px;
	}

	.changes-list {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
	}

	.field-change {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		font-size: 0.85em;
		padding: 0.25em 0.5em;
		background-color: rgba(0, 0, 0, 0.15);
		border-radius: 0.3em;
	}

	.field-name {
		font-weight: 600;
		color: var(--theme-color-2);
		font-family: monospace;
		font-size: 0.9em;
	}

	.field-prev {
		color: var(--text-color-2);
		text-decoration: line-through;
		opacity: 0.6;
	}

	.field-new {
		font-weight: 600;
	}

	.value-up .field-new {
		color: rgb(var(--green));
	}

	.value-down .field-new {
		color: rgb(var(--red));
	}

	.change-desc {
		color: var(--text-color-2);
		font-style: italic;
		font-size: 0.9em;
	}

	.time {
		font-size: 0.85rem;
		white-space: nowrap;
		color: var(--text-color-2);
	}

	/* Responsive */
	@media only screen and (max-width: 768px) {
		.controls {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
			padding: 0.6rem 0.75rem;
		}

		.control-group {
			flex-wrap: wrap;
			gap: 0.4rem;
		}

		.button-group {
			flex-wrap: wrap;
		}

		.button-group button {
			padding: 0.4rem 0.6rem;
			font-size: 0.75rem;
		}

		.item-icon {
			width: 28px;
			height: 28px;
		}

		.field-change {
			flex-wrap: wrap;
			gap: 0.2em;
		}
	}
</style>
