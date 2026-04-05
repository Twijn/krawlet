<script lang="ts">
	import SortableTable from "$lib/components/ui/SortableTable.svelte";
	import { getSyncNode } from "$lib/consts";
    import settings, { type Wallet } from "$lib/stores/settings";
	import type { SortableColumnData } from "$lib/components/ui/SortableTable";
    import AddressComp from "$lib/components/widgets/addresses/Address.svelte"
	import { formatCurrency } from "$lib/util";
	import { AddressCache } from "$lib/cache/AddressCache";
	import Button from "$lib/components/ui/Button.svelte";
	import { editWalletModal } from "$lib/stores/editWalletModal";

    type WalletWithAddress = Wallet & {
        balance: number,
        names?: number,
        actions?: never,
    };
    
    let wallets = $state<WalletWithAddress[]>([]);

    const cache = new AddressCache();

    const addressCache = cache.get({
        addresses: $settings.wallets.filter(x => x.syncNode === getSyncNode().id).map(x => x.address),
    });

    const loading = $derived($addressCache?.loading ?? true)

    let sortedColumn: keyof WalletWithAddress = $state("name");
    let sortDirection: "ASC" | "DESC" = $state("ASC");

    const refresh = () => {
        wallets = wallets
            .filter(x => x.syncNode === getSyncNode().id)
            .sort((a, b) => {
                if (!sortedColumn) return 0;

                const aValue = a[sortedColumn as keyof WalletWithAddress];
                const bValue = b[sortedColumn as keyof WalletWithAddress];

                if (typeof aValue === "string" && typeof bValue === "string") {
                    return sortDirection === "ASC"
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                } else if (typeof aValue === "number" && typeof bValue === "number") {
                    return sortDirection === "ASC" ? aValue - bValue : bValue - aValue;
                } else {
                    return 0;
                }
            });
    }

    settings.subscribe(value => {
        wallets = value.wallets
            .filter(x => x.syncNode === getSyncNode().id)
            .map(x => ({ ...x, balance: 0, names: 0 }));

        if (addressCache) {
            cache.update({
                addresses: wallets.filter(x => x.syncNode === getSyncNode().id).map(x => x.address)
            });
        }

        refresh();
    });

    addressCache?.subscribe((obj) => {
        console.log("address cache updated", obj);
        wallets = wallets.map(wallet => ({
            ...wallet,
            balance: obj.data?.addressList?.[wallet.address]?.balance ?? wallet.balance,
            names: obj.data?.addressList?.[wallet.address]?.names ?? wallet.names
        }));
        refresh();
    });

    const columns: SortableColumnData<keyof WalletWithAddress>[] = [
        { key: "address", label: "Address", align: "right", sortable: true },
        { key: "name", label: "Name", sortable: true },
        { key: "balance", label: "Balance", align: "right", sortable: true },
        { key: "names", label: "Names", align: "right", sortable: true },
        { key: "actions", label: "Actions", align: "right", sortable: false }
    ];
</script>

<SortableTable
    bind:sortDirection
    bind:sortedColumn
    {columns}
    {refresh}
    {loading}
    data={wallets}
>
    {#snippet cell(item, column)}
        {#if column.key === "address"}
            <AddressComp address={item.address} />
        {:else if column.key === "balance"}
            {formatCurrency(item.balance)} <small>KRO</small>
        {:else if column.key === "names"}
            {item.names} <small>name{item.names === 1 ? "" : "s"}</small>
        {:else if column.key === "actions"}
            <Button variant="secondary" size="small" tk="wallet.editWallet" onClick={() => editWalletModal.open(item)} />
            <Button variant="primary" size="small" tk="address.viewAddress" href="/addresses/{item.address}" />
        {:else}
            {item[column.key]}
        {/if}
    {/snippet}
</SortableTable>
