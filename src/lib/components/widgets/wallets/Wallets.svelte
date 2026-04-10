<script lang="ts">
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import { getSyncNode } from '$lib/consts';
	import settings, { type Wallet } from '$lib/stores/settings';
	import type { SortableColumnData } from '$lib/components/ui/SortableTable';
	import AddressComp from '$lib/components/widgets/addresses/Address.svelte';
	import { formatCurrency } from '$lib/util';
	import { AddressCache } from '$lib/cache/AddressCache';
	import Button from '$lib/components/ui/Button.svelte';
	import { editWalletModal } from '$lib/stores/editWalletModal';

	type WalletWithAddress = Wallet & {
		balance: number;
		names?: number;
		actions?: never;
	};

	const cache = new AddressCache();
	const getWalletAddresses = () =>
		$settings.wallets
			.filter((wallet) => wallet.syncNode === getSyncNode().id)
			.map((wallet) => wallet.address);

	const compareWallets = (a: WalletWithAddress, b: WalletWithAddress) => {
		if (!sortedColumn) return 0;

		const aValue = a[sortedColumn as keyof WalletWithAddress];
		const bValue = b[sortedColumn as keyof WalletWithAddress];

		if (typeof aValue === 'string' && typeof bValue === 'string') {
			return sortDirection === 'ASC' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
		}

		if (typeof aValue === 'number' && typeof bValue === 'number') {
			return sortDirection === 'ASC' ? aValue - bValue : bValue - aValue;
		}

		return 0;
	};

	let currentNodeWallets = $derived(
		$settings.wallets.filter((wallet) => wallet.syncNode === getSyncNode().id)
	);
	let walletAddresses = $derived(currentNodeWallets.map((wallet) => wallet.address));
	let walletAddressesKey = $derived(walletAddresses.join(','));
	let lastRequestedWalletAddressesKey = $state<string | null>(null);

	const addressCache = cache.get({
		addresses: getWalletAddresses()
	});

	let sortedColumn: keyof WalletWithAddress = $state('name');
	let sortDirection: 'ASC' | 'DESC' = $state('ASC');

	let wallets: WalletWithAddress[] = $derived.by(() => {
		const addressList = $addressCache?.data?.addressList ?? {};

		return currentNodeWallets
			.map((wallet) => ({
				...wallet,
				balance: addressList[wallet.address]?.balance ?? 0,
				names: addressList[wallet.address]?.names ?? 0
			}))
			.slice()
			.sort(compareWallets);
	});

	const refresh = () => {
		if (addressCache) {
			cache.update({ addresses: [...walletAddresses] });
		}
	};

	$effect(() => {
		if (walletAddressesKey === lastRequestedWalletAddressesKey) return;
		lastRequestedWalletAddressesKey = walletAddressesKey;
		refresh();
	});

	const columns: SortableColumnData<keyof WalletWithAddress>[] = [
		{ key: 'address', label: 'Address', align: 'right', sortable: true },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'balance', label: 'Balance', align: 'right', sortable: true },
		{ key: 'names', label: 'Names', align: 'right', sortable: true },
		{ key: 'actions', label: 'Actions', align: 'right', sortable: false }
	];
</script>

<SortableTable bind:sortDirection bind:sortedColumn {columns} {refresh} data={wallets}>
	{#snippet cell(item, column)}
		{#if column.key === 'address'}
			<AddressComp address={item.address} />
		{:else if column.key === 'balance'}
			{formatCurrency(item.balance)} <small>KRO</small>
		{:else if column.key === 'names'}
			{item.names} <small>name{item.names === 1 ? '' : 's'}</small>
		{:else if column.key === 'actions'}
			<Button
				variant="secondary"
				size="small"
				tk="wallet.editWallet"
				onClick={() => editWalletModal.open(item)}
			/>
			<Button
				variant="primary"
				size="small"
				tk="address.viewAddress"
				href="/addresses/{item.address}"
			/>
		{:else}
			{item[column.key]}
		{/if}
	{/snippet}
</SortableTable>
