<script lang="ts">
	import { verified, type VerifiedEntry } from '$lib/verified';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import { formatCurrency, relativeTime } from '$lib/util';
	import Transactions from '$lib/components/widgets/transactions/Transactions.svelte';
	import { onDestroy } from 'svelte';
	import { type Player, playerWalletStore } from '$lib/playerWallets';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import Names from '$lib/components/widgets/names/Names.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const { data } = $props();
	const address = $derived(data.address);

	const verifiedEntry: VerifiedEntry | null = $derived(verified[address.address] ?? null);

	let player: Player | null = $derived(
		$playerWalletStore.players.find((x) => x.kromerAddress === address.address) ?? null
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
			<Button href="/transactions/new?to_address={address.address}">Send Kromer</Button>
		</div>
	</div>
	<div class="statistic">
		<h2>Address</h2>
		<div>
			{address.address}
		</div>
	</div>
	{#if player || verifiedEntry}
		<div class="statistic">
			<h2>{verifiedEntry ? 'Verified As' : 'Owned By'}</h2>
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
		<div>
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

<Names lgCols={5} smCols={12} limit={4} address={address.address} queryPrefix="name_" />

<style>
	.statistics {
		display: flex;
		justify-content: left;
		gap: 2.5em;
		margin: 0.5em 0 1.5em 0;
	}

	.statistic h2 {
		color: var(--text-color-2);
		font-size: 0.9rem;
		font-weight: 500;
		text-transform: uppercase;
		margin: 0;
	}

	.statistic div {
		margin-top: 0.5rem;
		font-size: 1.6em;
	}

	.statistic .inout {
		font-size: 0.9em;
		text-align: right;
		opacity: 0.8;
	}

	@media only screen and (max-width: 1000px) {
		.statistics {
			flex-direction: column;
			gap: 1.5em;
		}

		.mobile-hide {
			display: none;
		}
	}
</style>
