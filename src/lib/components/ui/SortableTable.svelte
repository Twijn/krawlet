<script lang="ts" generics="T extends string, D">
	import { type Snippet } from 'svelte';
	import type { SortableColumnData, SortableTableProps } from './SortableTable';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faArrowUp, faSort } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';

	type Props = SortableTableProps & {
		title?: string;
		headerCell?: Snippet<[key: T, label: string]>;
		cell: Snippet<[item: D, column: SortableColumnData<T>]>;
		rowContextMenu?: ((event: MouseEvent, item: D) => void) | null;
		columns: SortableColumnData<T>[];
		data: D[];
		hydrated?: boolean;
		loading?: boolean;
		sortedColumn?: T | null;
		sortDirection?: 'ASC' | 'DESC';
		refresh: () => void;
	};

	let {
		title,
		headerCell,
		cell,
		rowContextMenu = null,
		columns,
		data,
		loading = $bindable(false),
		hydrated = $bindable(true),
		limit = $bindable(30),
		page = $bindable(1),
		total = $bindable(0),
		sortedColumn = $bindable(null),
		sortDirection = $bindable('ASC'),
		refresh
	}: Props = $props();

	let blocking: boolean = $derived(loading && !hydrated);

	function onHeaderClick(column: SortableColumnData<T>) {
		if (!column.sortable) return;

		if (sortedColumn === column.key) {
			// toggle sort direction
			sortDirection = sortDirection === 'ASC' ? 'DESC' : 'ASC';
		} else {
			sortedColumn = column.key;
			sortDirection = 'ASC';
		}
		refresh();
	}
</script>

{#if title}
	<h2>{title}</h2>
{/if}

<div class="table-wrapper" class:loading={blocking}>
	<div class="table-container">
		<table class="sortable-table">
			<thead>
				<tr>
					{#each columns as column (column.key)}
						<th
							style="text-align: {column.align ?? 'left'}"
							class:clickable={column.sortable}
							onclick={() => onHeaderClick(column)}
						>
							{#if headerCell}
								{@render headerCell(column.key, column.label)}
							{:else}
								{column.label}
							{/if}
							{#if column.sortable}
								<span
									class="sort-icon title-bottom"
									class:active={sortedColumn === column.key}
									title={sortedColumn === column.key
										? sortDirection === 'ASC'
											? 'Sorted ascending'
											: 'Sorted descending'
										: 'Not sorted'}
								>
									{#if sortedColumn === column.key}
										<span class="sort-arrow" class:desc={sortDirection === 'DESC'}>
											<FontAwesomeIcon icon={faArrowUp} size="sm" />
										</span>
									{:else}
										<FontAwesomeIcon icon={faSort} size="sm" />
									{/if}
								</span>
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each data as item (item)}
					<tr
						class:context-menu-row={Boolean(rowContextMenu)}
						oncontextmenu={(event) => rowContextMenu?.(event, item)}
					>
						{#each columns as column (column.key)}
							<td style="text-align: {column.align ?? 'left'}">
								{@render cell(item, column)}
							</td>
						{/each}
					</tr>
				{/each}
				{#if data.length === 0}
					<tr>
						<td colspan={columns.length} class="empty-state"> No data </td>
					</tr>
				{/if}
			</tbody>
		</table>
		<ModuleLoading loading={blocking} absolute />
	</div>
</div>

<style>
	.table-wrapper {
		position: relative;
	}

	h2 {
		margin: 0 0 0.5em 0;
		padding: 0 0 0.25em 0;
		font-size: 1.3rem;
		font-weight: 500;
		border-bottom: 0.1em solid var(--theme-color-2);
	}

	.table-wrapper.loading .table-container {
		pointer-events: none;
	}

	.sort-icon {
		margin-left: 0.3em;
		opacity: 0.5;
		display: inline-block;
	}

	.sort-icon.active {
		opacity: 1;
	}

	.sort-arrow {
		display: inline-block;
		transition: transform 0.2s ease;
	}

	.sort-arrow.desc {
		transform: rotate(180deg);
	}

	.clickable:hover .sort-icon {
		opacity: 0.8;
	}

	.clickable:hover .sort-icon.active {
		opacity: 1;
	}

	.context-menu-row {
		cursor: context-menu;
		transition: background-color 0.15s ease;
	}

	.context-menu-row:hover {
		background-color: rgba(var(--theme-color-rgb), 0.05);
	}
</style>
