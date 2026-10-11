<script lang="ts">
	import { formatCurrency, getMinecraftAvatar, relativeTime } from '$lib/util';
	import { onDestroy } from 'svelte';
	import playerWalletStore, { type Player } from '$lib/stores/playerWallets';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import { getAddress, type KnownAddress } from '$lib/stores/knownAddresses';
	import AdvancedTransactions from '$lib/components/widgets/transactions/AdvancedTransactions.svelte';
	import AdvancedNames from '$lib/components/widgets/names/AdvancedNames.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import {
		faAddressBook,
		faBuilding,
		faCheckCircle,
		faDice,
		faGear,
		faPaperPlane,
		faStore
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	const { data } = $props();
	const address = $derived(data.address);

	const knownEntry: KnownAddress | null = $derived(getAddress(address.address));
	const knownAddressTypeLabels: Record<KnownAddress['type'], string> = {
		official: 'Official',
		shop: 'Shop',
		gamble: 'Gambling',
		service: 'Service',
		company: 'Company'
	};

	const knownAddressTypeVariant: Record<
		KnownAddress['type'],
		'green' | 'blue' | 'red' | 'yellow' | 'purple'
	> = {
		official: 'green',
		shop: 'blue',
		gamble: 'red',
		service: 'yellow',
		company: 'purple'
	};

	const knownAddressTypeDescriptions: Record<KnownAddress['type'], string> = {
		official: 'Verified by Krawlet as an official address.',
		shop: 'Listed in Krawlet as a shop address.',
		gamble: 'Listed in Krawlet as a gambling address.',
		service: 'Listed in Krawlet as a service address.',
		company: 'Listed in Krawlet as a company address.'
	};

	let player: Player | null = $derived(
		$playerWalletStore.data.find((x) => x.kromerAddress === address.address) ?? null
	);

	const playerStatusLabel = $derived(player?.online ? 'Online now' : 'Offline');

	onDestroy(playerWalletStore.destroy);

	const effectiveName = $derived(
		player?.minecraftName ?? knownEntry?.name ?? address.address ?? 'unknown'
	);
</script>

<svelte:head>
	<title>{effectiveName} | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: 'Addresses', href: '/addresses' },
		{ label: effectiveName, href: `/addresses/${address.address}` }
	]}
	buttons={[
		{
			tk: 'address.actions.viewTransactions',
			href: `/addresses/${address.address}/transactions`,
			icon: faAddressBook,
			variant: 'secondary'
		},
		{
			label: `Pay ${effectiveName}`,
			href: `/transactions/new?to=${address.address}`,
			icon: faPaperPlane,
			variant: 'primary'
		}
	]}
/>

{#if knownEntry}
	<div
		class="known-entry-card col-12"
		class:official={knownEntry.type === 'official'}
		class:shop={knownEntry.type === 'shop'}
		class:gamble={knownEntry.type === 'gamble'}
		class:service={knownEntry.type === 'service'}
		class:company={knownEntry.type === 'company'}
	>
		<div class="known-entry-card__header">
			<div class="known-entry-card__avatar" aria-hidden="true">
				{#if knownEntry.imageSrc}
					<img src={knownEntry.imageSrc} alt="" />
				{:else if knownEntry.type === 'shop'}
					<FontAwesomeIcon icon={faStore} />
				{:else if knownEntry.type === 'gamble'}
					<FontAwesomeIcon icon={faDice} />
				{:else if knownEntry.type === 'company'}
					<FontAwesomeIcon icon={faBuilding} />
				{:else if knownEntry.type === 'service'}
					<FontAwesomeIcon icon={faGear} />
				{:else}
					<FontAwesomeIcon icon={faCheckCircle} />
				{/if}
			</div>

			<div class="known-entry-card__identity">
				<div class="known-entry-card__eyebrow">Known address</div>
				<div class="known-entry-card__title-row">
					<h2>{knownEntry.name}</h2>
					<div class="known-entry-card__title-row">
						<Tag variant={knownAddressTypeVariant[knownEntry.type]} uppercase={true}>
							{knownAddressTypeLabels[knownEntry.type]}
						</Tag>
						{#if knownEntry.updatedDate}
							<Tag variant="gray" title={new Date(knownEntry.updatedDate).toLocaleString()}>
								Updated {relativeTime(new Date(knownEntry.updatedDate))}
							</Tag>
						{/if}
					</div>
				</div>
				<p class="known-entry-card__summary">{knownAddressTypeDescriptions[knownEntry.type]}</p>
			</div>
		</div>

		{#if knownEntry.description}
			<p class="known-entry-card__description">{knownEntry.description}</p>
		{/if}
	</div>
{/if}

{#if player}
	<div class="known-entry-card identity-card--player col-12">
		<div class="known-entry-card__header">
			<div class="known-entry-card__avatar" aria-hidden="true">
				<img src={getMinecraftAvatar(player.minecraftUUID)} alt="" />
			</div>

			<div class="known-entry-card__identity">
				<div class="known-entry-card__eyebrow">Player identity</div>
				<div class="known-entry-card__title-row">
					<h2>{player.minecraftName}</h2>
					<div class="known-entry-card__title-row">
						<Tag variant="blue" uppercase={true}>Player</Tag>
						<Tag variant={player.online ? 'green' : 'gray'}>{playerStatusLabel}</Tag>
						{#if !player.online && player.lastSeenDate}
							<Tag variant="gray" title={new Date(player.lastSeenDate).toLocaleString()}>
								Last online {relativeTime(new Date(player.lastSeenDate))}
							</Tag>
						{/if}
					</div>
				</div>
				<p class="known-entry-card__summary">
					This address is linked to a Minecraft player profile tracked by Krawlet.
				</p>
			</div>
		</div>
	</div>
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
			<h2>{knownEntry ? 'Known As' : 'Owned By'}</h2>
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
	<AdvancedNames
		storePrefix="nm"
		title="Names"
		limit={15}
		query={{}}
		addresses={[address.address]}
		showDetails={true}
	/>
	<AdvancedTransactions
		storePrefix="tx"
		title="Transactions"
		limit={15}
		query={{}}
		addresses={[address.address]}
		showDetails={true}
	/>
</div>

<style>
	.known-entry-card {
		--known-entry-color: var(--theme-color-rgb);
		display: grid;
		gap: 0.9rem;
		padding: 1rem 1.1rem;
		margin: 1rem 0;
		border-radius: 0.75rem;
		background:
			radial-gradient(circle at top right, rgba(var(--known-entry-color), 0.14), transparent 34%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
		border: 1px solid rgba(var(--known-entry-color), 0.18);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
	}

	.identity-card--player {
		--known-entry-color: 255, 255, 255;
	}

	.known-entry-card.official {
		--known-entry-color: var(--green);
	}

	.known-entry-card.gamble {
		--known-entry-color: var(--red);
	}

	.known-entry-card__header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.known-entry-card__avatar {
		width: 3.2rem;
		height: 3.2rem;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.9rem;
		background:
			radial-gradient(circle at top, rgba(var(--known-entry-color), 0.28), transparent 65%),
			rgba(var(--known-entry-color), 0.12);
		border: 1px solid rgba(var(--known-entry-color), 0.25);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.known-entry-card__avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: inherit;
	}

	.known-entry-card__avatar :global(svg) {
		font-size: 1.4rem;
		color: rgba(var(--known-entry-color), 0.95);
	}

	.known-entry-card__identity {
		min-width: 0;
	}

	.known-entry-card__eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.72;
		margin-bottom: 0.2rem;
	}

	.known-entry-card__title-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		flex-wrap: wrap;
	}

	.known-entry-card__title-row h2 {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.2;
	}

	.known-entry-card__summary,
	.known-entry-card__description {
		margin: 0;
	}

	.known-entry-card__summary {
		font-size: 0.85rem;
		opacity: 0.85;
		margin-top: 0.45rem;
	}

	.known-entry-card__description {
		padding: 0.85rem 0.95rem;
		border-radius: 0.8rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		line-height: 1.45;
	}

	.statistic .inout {
		font-size: 0.9em;
		text-align: right;
		opacity: 0.8;
	}

	@media (max-width: 640px) {
		.known-entry-card__header {
			align-items: flex-start;
		}

		.known-entry-card__avatar {
			width: 2.8rem;
			height: 2.8rem;
		}
	}
</style>
