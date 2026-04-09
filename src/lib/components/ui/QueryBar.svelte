<script lang="ts" generics="T extends string">
	import Button from './Button.svelte';
	import SortChip from './SortChip.svelte';
	import FilterChip from './FilterChip.svelte';
	import type { SortableColumnData } from './SortableTable';
	import type { Snippet } from 'svelte';
	import type { Filter } from './QueryBar';
	import type { ButtonProps } from './Button';

	type Props = {
		/** Current sorted column key */
		sortedColumn: T;
		/** Current sort direction */
		sortDirection?: 'ASC' | 'DESC';
		/** Default column to sort by */
		defaultSortColumn: T;
		/** Default sort direction */
		defaultSortDirection?: 'ASC' | 'DESC';
		/** Column definitions for label lookup */
		columns?: SortableColumnData<T>[];
		/** Called to reset sort */
		onSortReset?: () => void;
		/** Active filters */
		filters?: Filter[];
		filterButtons?: ButtonProps[];
		/** Called when a filter is removed */
		onFilterRemove?: (filter: Filter) => void;
		/** Extra content to display */
		children?: Snippet;
	};

	const {
		sortedColumn = $bindable(),
		sortDirection = 'DESC',
		defaultSortColumn = $bindable(),
		defaultSortDirection = 'DESC',
		columns = [],
		onSortReset,
		filters = [],
		onFilterRemove,
		filterButtons = [],
		children
	}: Props = $props();
</script>

<div class="query-bar">
	{#if columns.length > 0 && sortedColumn}
		<SortChip
			{sortedColumn}
			{sortDirection}
			defaultColumn={defaultSortColumn}
			defaultDirection={defaultSortDirection}
			{columns}
			onReset={onSortReset}
		/>
	{/if}

	{#each filters as filter (filter.id)}
		<FilterChip
			field={filter.field}
			value={filter.value}
			color={filter.color}
			removable={filter.removable}
			onRemove={() => onFilterRemove?.(filter)}
		/>
	{/each}

	{#each filterButtons as button, i (button.title ?? button.type + button.variant + i)}
		<Button {...button} />
	{/each}

	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.query-bar {
		display: flex;
		align-items: center;
		gap: 0.75em;
		flex-wrap: wrap;
	}
</style>
