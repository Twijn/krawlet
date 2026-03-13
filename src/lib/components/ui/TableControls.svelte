<script lang="ts">
    import { type Snippet } from "svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faSync } from "@fortawesome/free-solid-svg-icons";
    import Pagination from "./Pagination.svelte";
    import { t$ } from "$lib/i18n";

    type Props = {
        /** Whether the table is currently loading */
        loading?: boolean;
        /** Current page number */
        page?: number;
        /** Items per page */
        limit?: number;
        /** Total number of items */
        total?: number;
        /** Show pagination controls */
        showPagination?: boolean;
        /** Show refresh button */
        showRefresh?: boolean;
        /** Called when refresh is clicked */
        onRefresh?: () => void;
        /** Content to show in the left/main area (filters, sort chips, etc.) */
        children?: Snippet;
    };

    let {
        loading = false,
        page = $bindable(1),
        limit = $bindable(30),
        total = 0,
        showPagination = true,
        showRefresh = true,
        onRefresh,
        children
    }: Props = $props();
</script>

<div class="controls">
    <div class="majority">
        {#if children}
            {@render children()}
        {/if}
    </div>
    {#if showRefresh && onRefresh}
        <button
            class:loading
            type="button"
            onclick={onRefresh}
            disabled={loading}
            aria-label={$t$("common.refresh")}>
            <FontAwesomeIcon icon={faSync} />
        </button>
    {/if}
    {#if showPagination}
        <Pagination bind:page {limit} {total} />
    {/if}
</div>

<style>
    .controls {
        display: flex;
        align-items: center;
        margin-bottom: 0.5em;
        gap: .75em;
    }

    .controls .majority {
        flex-grow: 1;
        display: flex;
        align-items: center;
        gap: 0.75em;
    }

    .controls button {
        background: none;
        border: none;
        color: var(--text-color-2);
        cursor: pointer;
        padding: 0.25em;
        font-size: .9em;
        transition: color 0.2s ease;
    }

    .controls button.loading {
        animation: spin 1s linear infinite;
        cursor: not-allowed;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
