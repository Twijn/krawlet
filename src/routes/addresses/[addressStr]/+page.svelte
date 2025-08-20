<script lang="ts">
	import { verified, type VerifiedEntry } from '$lib/verified';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faInfoCircle, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { relativeTime } from '$lib/util';
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

{#if verifiedEntry}
	<Alert variant={verifiedEntry.type === 'official' ? 'success' : 'info'}>
		<strong
			>This address is verified{verifiedEntry.type === 'shop'
				? ' as an official shop'
				: ''}!</strong
		>
		<p>
			{verifiedEntry.description}
		</p>
	</Alert>
{/if}

<Section lgCols={3} mdCols={6} smCols={12}>
	<h2><FontAwesomeIcon icon={faInfoCircle} /> Information</h2>
	{#if address}
		<Button href="/transactions/new?to_address={address.address}" full={true}>
			<FontAwesomeIcon icon={faPaperPlane} />
			Pay {address.address}
		</Button>
		<div class="table-container">
			<table>
				<tbody>
					{#if player || verifiedEntry}
						<tr>
							<th>{verifiedEntry ? 'Verified As' : 'Owned By'}</th>
							<td class="right">
								<Address address={address.address} />
							</td>
						</tr>
					{/if}
					<tr>
						<th>Address</th>
						<td class="right">{address.address}</td>
					</tr>
					<tr>
						<th>Balance</th>
						<td class="right">{address.balance.toFixed(2)} <small>KRO</small></td>
					</tr>
					<tr>
						<th>Total In</th>
						<td class="right">{address.totalin.toFixed(2)} <small>KRO</small></td>
					</tr>
					<tr>
						<th>Total Out</th>
						<td class="right">{address.totalout.toFixed(2)} <small>KRO</small></td>
					</tr>
					<tr>
						<th>First Seen</th>
						<td class="right">{relativeTime(address.firstseen)}</td>
					</tr>
				</tbody>
			</table>
		</div>
	{:else}
		<ModuleLoading />
	{/if}
</Section>

{#if address}
	<Names
		lgCols={3}
		mdCols={6}
		smCols={12}
		limit={6}
		address={address.address}
		queryPrefix="name_"
	/>
{:else}
	<ModuleLoading />
{/if}

{#if address}
	<Transactions limit={6} address={address.address} lgCols={6} mdCols={12} queryPrefix="trans_" />
{:else}
	<ModuleLoading />
{/if}
