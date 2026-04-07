<script lang="ts">
	import { formatCurrency, relativeTime } from '$lib/util';
	import { onDestroy } from 'svelte';
	import playerWalletStore, { type Player } from '$lib/stores/playerWallets';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import { getAddress, type KnownAddress } from '$lib/stores/knownAddresses';
	import AdvancedTransactions from '$lib/components/widgets/transactions/AdvancedTransactions.svelte';
	import AdvancedNames from '$lib/components/widgets/names/AdvancedNames.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import { faAddressBook, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import Alert from '$lib/components/dialogs/Alert.svelte';

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

<Breadcrumbs
	navItems={[
		{ label: 'Addresses', href: '/addresses' },
		{ label: address.address, href: `/addresses/${address.address}` }
	]}
	buttons={[
		{
			tk: 'address.actions.viewTransactions',
			href: `/addresses/${address.address}/transactions`,
			icon: faAddressBook,
			variant: 'secondary'
		},
		{
			tk: 'address.actions.sendKromer',
			href: `/transactions/new?to=${address.address}`,
			icon: faPaperPlane,
			variant: 'primary'
		}
	]}
/>

{#if knownEntry}
	<Alert variant={knownEntry.type === 'official' ? 'success' : 'info'}>
		This address is known as <strong>{knownEntry.name}</strong>.
		{#if knownEntry.description}
			<p><strong>Description:</strong> {knownEntry.description}</p>
		{/if}
	</Alert>
{/if}

<div class="col-12 statistics">
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

<div class="col-12">
	<AdvancedNames title="Names" limit={15} query={{}} addresses={[address.address]} showDetails={true} />
	<AdvancedTransactions title="Transactions" limit={15} query={{}} addresses={[address.address]} showDetails={true} />
</div>

<style>
	.statistic .inout {
		font-size: 0.9em;
		text-align: right;
		opacity: 0.8;
	}
</style>
