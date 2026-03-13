<script lang="ts" generics="T extends string, D">
	import { type Snippet } from "svelte";
	import type { SortableColumnData, SortableTableProps } from "./SortableTable";
	import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
	import { faArrowUp, faSort } from "@fortawesome/free-solid-svg-icons";
	import ModuleLoading from "$lib/components/widgets/other/ModuleLoading.svelte";

    type Props = SortableTableProps & {
        headerCell?: Snippet<[key: T, label: string]>;
        cell: Snippet<[item: D, column: SortableColumnData<T>]>;
        columns: SortableColumnData<T>[];
        data: D[];
        hydrated?: boolean;
        loading?: boolean;
        sortedColumn: T | null;
        sortDirection: "ASC" | "DESC";
        refresh: () => void;
    };

    let {
        headerCell,
        cell,
        columns,
        data,
        loading = $bindable(false),
        hydrated = $bindable(true),
        limit = $bindable(30),
        page = $bindable(1),
        total = $bindable(0),
        sortedColumn = $bindable(null),
        sortDirection = $bindable("ASC"),
        refresh
    }: Props = $props();

    function onHeaderClick(column: SortableColumnData<T>) {
        if (!column.sortable) return;

        if (sortedColumn === column.key) {
            // toggle sort direction
            sortDirection = sortDirection === "ASC" ? "DESC" : "ASC";
        } else {
            sortedColumn = column.key;
            sortDirection = "ASC";
        }
        refresh();
    }
</script>

<div class="table-wrapper" class:loading>
    <div class="table-container">
        <table class="sortable-table">
            <thead>
                <tr>
                    {#each columns as column (column.key)}
                        <th style="text-align: {column.align ?? 'left'}" class:clickable={column.sortable} onclick={() => onHeaderClick(column)}>
                            {#if headerCell}
                                {@render headerCell(column.key, column.label)}
                            {:else}
                                {column.label}
                            {/if}
                            {#if column.sortable}
                                <span class="sort-icon" class:active={sortedColumn === column.key}>
                                    {#if sortedColumn === column.key}
                                        <span class="sort-arrow" class:desc={sortDirection === "DESC"}>
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
                {#each data as item, i (i)}
                    <tr>
                        {#each columns as column (column.key)}
                            <td style="text-align: {column.align ?? 'left'}">
                                {@render cell(item, column)}
                            </td>
                        {/each}
                    </tr>
                {/each}
                {#if data.length === 0}
                    <tr>
                        <td colspan={columns.length} class="empty-state">
                            No data
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
        <ModuleLoading loading={loading && !hydrated} absolute />
    </div>
</div>

<style>
    .table-wrapper {
        position: relative;
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
</style>
