<script lang="ts">
    import Chip from "./Chip.svelte";
    import type { SortableColumnData } from "./SortableTable";

    type Props<T extends string> = {
        /** Current sorted column key */
        sortedColumn: T | null;
        /** Current sort direction */
        sortDirection: "ASC" | "DESC";
        /** Default column to sort by (won't show chip when this is active) */
        defaultColumn?: T | null;
        /** Default sort direction (won't show chip when this is active) */
        defaultDirection?: "ASC" | "DESC";
        /** Column definitions for label lookup */
        columns: SortableColumnData<T>[];
        /** Called to reset sort to default */
        onReset?: () => void;
    };

    let {
        sortedColumn,
        sortDirection,
        defaultColumn = null as string | null,
        defaultDirection = "DESC",
        columns,
        onReset
    }: Props<string> = $props();

    const isDefault = $derived(
        sortedColumn === defaultColumn && sortDirection === defaultDirection
    );

    const columnLabel = $derived(
        columns.find(c => c.key === sortedColumn)?.label || sortedColumn
    );
</script>

{#if !isDefault && sortedColumn}
    <Chip 
        label="Sort" 
        value="{columnLabel} {sortDirection}" 
        onRemove={onReset}
    />
{/if}
