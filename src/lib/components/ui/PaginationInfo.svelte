<script lang="ts">
    type Props = {
        /** Current page (1-indexed) */
        page?: number;
        /** Items per page */
        limit?: number;
        /** Total number of items */
        total: number;
        /** Item name (singular) */
        itemName?: string;
        /** Item name (plural) */
        itemNamePlural?: string;
    };

    let {
        page = 1,
        limit = 30,
        total,
        itemName = "item",
        itemNamePlural = "items"
    }: Props = $props();

    const offset = $derived((page - 1) * limit);
    const startNum = $derived(offset + 1);
    const endNum = $derived(Math.min(offset + limit, total));
    const displayName = $derived(total === 1 ? itemName : itemNamePlural);
</script>

<small class="pagination-info">
    Showing {startNum.toLocaleString()}-{endNum.toLocaleString()} of {total.toLocaleString()} {displayName}
</small>

<style>
    .pagination-info {
        color: var(--text-color-2);
    }
</style>
