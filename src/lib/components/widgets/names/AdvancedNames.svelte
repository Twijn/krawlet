<script lang="ts">
    import type { Name, NameLookupQuery } from "kromer";
	import SortableTable from "$lib/components/ui/SortableTable.svelte";
	import Address from "../addresses/Address.svelte";
	import Placeholder from "$lib/components/ui/Placeholder.svelte";
	import type { SortableColumnData } from "$lib/components/ui/SortableTable";
	import TableControls from "$lib/components/ui/TableControls.svelte";
	import QueryBar from "$lib/components/ui/QueryBar.svelte";
	import LimitSelector from "$lib/components/ui/LimitSelector.svelte";
	import PaginationInfo from "$lib/components/ui/PaginationInfo.svelte";
	import AddressFilterModal from "$lib/components/dialogs/AddressFilterModal.svelte";
	import type { Filter } from "$lib/components/ui/QueryBar";
	import { faPlus } from "@fortawesome/free-solid-svg-icons";
	import { NameCache, type NameCacheLookup } from "$lib/cache";
	import { relativeTime } from "$lib/util";
	import { paramState } from "$lib/paramState.svelte";
	import settings from "$lib/stores/settings";

    let {
        query = {},
        showDetails = false,
        addresses = $bindable([]),
        limit = $bindable(30),
        storePrefix = "",
        title,
    }: {
        query?: NameLookupQuery;
        showDetails?: boolean;
        addresses?: string[];
        limit: number;
        storePrefix?: string;
        title?: string;
    } = $props();

    const cache = new NameCache();

    let page = paramState<number>(`${storePrefix}page`, 1, {
        serialize: (v) => v.toString(),
        deserialize: (s) => parseInt(s) || 1,
        shouldSet: (v) => v > 1
    });
    let sortedColumn: keyof Name | null = $state("registered");
    let sortDirection: "ASC" | "DESC" = $state("DESC");
    let offset = $derived((page.value - 1) * limit);

    // Address filter modal state
    let showAddressModal = $state(false);
    
    // Internal address filters (with labels for display)
    type AddressFilter = { address: string; label?: string };
    let addressFilters: AddressFilter[] = $state([]);
    
    // Combine prop addresses with internal filters
    let allAddresses = $derived([...addresses, ...addressFilters.map(f => f.address)]);
    
    // Convert to Filter[] for QueryBar (includes both prop addresses and internal filters)
    let filters: Filter[] = $derived([
        // Prop addresses (not removable)
        ...addresses.map((addr, i) => ({
            id: `prop-address-${i}`,
            field: "Address",
            value: addr,
            color: "var(--blue)",
            removable: false
        })),
        // Internal address filters (removable)
        ...addressFilters.map((f, i) => ({
            id: `address-${i}`,
            field: "Address",
            value: f.label || f.address,
            color: "var(--blue)"
        }))
    ]);

    let queryData: NameCacheLookup = $derived({
        orderBy: sortedColumn ?? "registered",
        order: sortDirection,
        ...query,
        addresses: allAddresses,
        limit,
        offset,
    });

    // svelte-ignore state_referenced_locally
    const nameQuery = cache.get(queryData);

    const refresh = () => {
        cache.update(queryData);
    };

    // Re-fetch when query parameters change (page, sort, etc.)
    $effect(() => {
        cache.update(queryData);
    });

    let loading: boolean = $derived($nameQuery?.loading ?? true);
    let names: Name[] = $derived($nameQuery?.data?.names ?? []);
    let total: number = $derived($nameQuery?.data?.total ?? 0);

    const originalOwnerRow: SortableColumnData<keyof Name> = {
        key: "original_owner",
        label: "Original Owner",
        align: "right",
        sortable: true
    };

    const transferredRow: SortableColumnData<keyof Name> = {
        key: "transferred",
        label: "Transferred",
        align: "right",
        sortable: true
    };

    let columns: SortableColumnData<keyof Name>[] = $state([
        { key: "name", label: "Name", align: "right", sortable: true },
        { key: "owner", label: "Owner", align: "right", sortable: true },
        { key: "original_owner", label: "Original Owner", align: "right", sortable: true },
        { key: "a", label: "A", align: "right", sortable: true },
        { key: "transferred", label: "Transferred", align: "right", sortable: true },
        { key: "updated", label: "Updated", align: "right", sortable: true },
        { key: "registered", label: "Registered", align: "right", sortable: true }
    ]);

    settings.subscribe(value => {
        if (value.showOriginalOwner) {
            if (!columns.find(c => c.key === "original_owner")) {
                columns.splice(2, 0, originalOwnerRow);
            }
        } else {
            columns = columns.filter(c => c.key !== "original_owner");
        }

        if (value.showTransferredDate) {
            if (!columns.find(c => c.key === "transferred")) {
                columns.splice(3, 0, transferredRow);
            }
        } else {
            columns = columns.filter(c => c.key !== "transferred");
        }
    });

    const resetSort = () => {
        sortedColumn = "registered";
        sortDirection = "DESC";
    };

    const handleAddAddress = (address: string, label?: string) => {
        // Don't add duplicates
        if (addressFilters.some(f => f.address === address)) return;
        addressFilters = [...addressFilters, { address, label }];
        page.value = 1; // Reset to first page when filter changes
    };

    const handleRemoveFilter = (filter: Filter) => {
        // Only allow removing internal filters, not prop addresses
        if (!filter.id.startsWith("address-")) return;
        const index = parseInt(filter.id.replace("address-", ""));
        addressFilters = addressFilters.filter((_, i) => i !== index);
        page.value = 1; // Reset to first page when filter changes
    };
</script>

<AddressFilterModal
    bind:open={showAddressModal}
    onClose={() => showAddressModal = false}
    onSelect={handleAddAddress}
    selectedAddresses={allAddresses}
/>

{#if !title}
    <TableControls
        {loading}
        bind:page={page.value}
        {limit}
        {total}
        onRefresh={refresh}
    >
        {#if showDetails}
            <QueryBar
                {sortedColumn}
                {sortDirection}
                defaultSortColumn="registered"
                defaultSortDirection="DESC"
                {columns}
                onSortReset={resetSort}
                {filters}
                onFilterRemove={handleRemoveFilter}
                filterButtons={[
                    {
                        tk: "transaction.addAddressFilter",
                        type: "button",
                        variant: "primary",
                        icon: faPlus,
                        size: "small",
                        onClick: () => showAddressModal = true
                    }
                ]}
            />
        {/if}
    </TableControls>
{/if}

<SortableTable 
    {refresh} 
    {columns} 
    data={names}
    {loading}
    {title}
    bind:sortedColumn
    bind:sortDirection
>
    {#snippet cell(item, column)}
        {#if column.key === "owner" || column.key === "original_owner"}
            {@const address = item[column.key]}
            {#if address}
                <Address address={address} />
            {:else}
                <Placeholder />
            {/if}
        {:else if column.key === "name"}
            {item.name}<small>.kro</small>
        {:else if column.key === "registered" || column.key === "updated" || column.key === "transferred"}
            {@const value = item[column.key]}
            {#if value && new Date(value).getTime() > 1_000_000}
                <small class:title-right={column.key === "registered"} title={new Date(value).toLocaleString()}>
                    {relativeTime(value)}
                </small>
            {:else}
                <Placeholder />
            {/if}
        {:else if column.key === "a"}
            {#if item.a}
                {item.a}
            {:else}
                <Placeholder />
            {/if}
        {/if}
    {/snippet}
</SortableTable>
{#if $nameQuery?.error}
    <div class="error">Error: {$nameQuery.error.message}</div>
{/if}

<TableControls
    {loading}
    bind:page={page.value}
    {limit}
    {total}
    onRefresh={refresh}
>
    {#if showDetails}
        <LimitSelector bind:limit />
    {/if}
    <PaginationInfo page={page.value} {limit} {total} itemName="name" itemNamePlural="names" />
</TableControls>

<style>
    .error {
        color: rgb(var(--red));
        margin-top: 1em;
    }
</style>
