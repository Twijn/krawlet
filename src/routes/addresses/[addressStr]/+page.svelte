<script lang="ts">
	import { formatCurrency, relativeTime } from '$lib/util';
	import { onDestroy } from 'svelte';
	import playerWalletStore, { type Player } from '$lib/stores/playerWallets';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import AddressStats from '$lib/components/widgets/addresses/AddressStats.svelte';
	import { getAddress, type KnownAddress } from '$lib/stores/knownAddresses';
	import AdvancedTransactions from '$lib/components/widgets/transactions/AdvancedTransactions.svelte';
	import AdvancedNames from '$lib/components/widgets/names/AdvancedNames.svelte';

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
			<Button variant="primary" href="/transactions/new?to={address.address}">Send Kromer</Button>
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

<div class="col-7 col-md-12">
	<AdvancedTransactions limit={10} query={{}} addresses={[address.address]} />
</div>
<div class="col-5 col-md-12">
	<AdvancedNames limit={10} query={{}} addresses={[address.address]} />
</div>

<AddressStats address={address.address} />

<style>
	.statistic .inout {
		font-size: 0.9em;
		text-align: right;
		opacity: 0.8;
	}
</style>
