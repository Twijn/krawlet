<script lang="ts">
	import { formatCurrency, relativeTime } from '$lib/util';
	import Transactions from '$lib/components/widgets/transactions/Transactions.svelte';
	import { onDestroy } from 'svelte';
	import playerWalletStore, { type Player } from '$lib/stores/playerWallets';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import Names from '$lib/components/widgets/names/Names.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import AddressStats from '$lib/components/widgets/addresses/AddressStats.svelte';
	import { getAddress, type KnownAddress } from '$lib/stores/knownAddresses';

	const { data } = $props();
	const address = $derived(data.address);

	const knownEntry: KnownAddress | null = $derived(getAddress(address.address));

	let player: Player | null = $derived(
		$playerWalletStore.data.find((x) => x.kromerAddress === address.address) ?? null
	);

	onDestroy(playerWalletStore.destroy);
</script>

<svelte:head>
	<title>{address.address} | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/addresses">Addresses</a> <span>&raquo;</span>
	<a href="/addresses/{address.address}">{address.address}</a>
</h1>

<div class="col-12 statistics">
	<div class="statistic">
		<div>
			<Button href="/transactions/new?to={address.address}">Send Kromer</Button>
		</div>
	</div>
	<div class="statistic">
		<h2>Address</h2>
		<div>
			{address.address}
		</div>
	</div>
	{#if player || knownEntry}
		<div class="statistic">
			<h2>{knownEntry ? 'Verified As' : 'Owned By'}</h2>
			<div>
				<Address address={address.address} />
			</div>
		</div>
	{/if}
	<div class="statistic">
		<h2>Balance</h2>
		<div>
			{formatCurrency(address.balance)} <small>KRO</small>
		</div>
	</div>
	<div class="statistic">
		<h2>First Seen</h2>
		<div title={new Date(address.firstseen).toLocaleString()}>
			{relativeTime(address.firstseen)}
		</div>
	</div>
	<div class="statistic mobile-hide">
		<h2>Total In / Out</h2>
		<div class="inout">
			<small>+</small>{formatCurrency(address.totalin)} <small>KRO</small>
			<br />
			<small>-</small>{formatCurrency(address.totalout)} <small>KRO</small>
		</div>
	</div>
</div>

<Transactions limit={4} address={address.address} lgCols={7} mdCols={12} queryPrefix="trans_" />

<Names lgCols={5} mdCols={12} limit={4} address={address.address} queryPrefix="name_" />

<AddressStats address={address.address} />

<style>
	.statistic .inout {
		font-size: 0.9em;
		text-align: right;
		opacity: 0.8;
	}
</style>
