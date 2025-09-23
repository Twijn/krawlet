<script lang="ts">
	import { onDestroy } from 'svelte';

	import playerWalletStore, { type Player } from '$lib/stores/playerWallets';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBuilding, faCheck, faCopy, faDice, faStore } from '@fortawesome/free-solid-svg-icons';
	import { notifications } from '$lib/stores/notifications';
	import { getAddress, type KnownAddress } from '$lib/stores/knownAddresses';
	import settings from '$lib/stores/settings';

	const {
		address
	}: {
		address: string;
	} = $props();

	let player: Player | null = $derived(
		$playerWalletStore.data.find((x) => x.kromerAddress === address) ?? null
	);

	onDestroy(playerWalletStore.destroy);

	let verifiedEntry: KnownAddress | null = $derived(getAddress(address));

	const copyAddress = async () => {
		try {
			await navigator.clipboard.writeText(address);
			notifications.success(`Address '${address}' copied to clipboard.`);
		} catch (err) {
			console.error(err);
			notifications.success('Failed to copy address to clipboard.');
		}
	};

	let special = $derived(
		Boolean(
			(player && $settings.replaceAddressesWithPlayer) ||
				(verifiedEntry && $settings.replaceAddressesWithKnown)
		)
	);
</script>

<a
	href="/addresses/{address}"
	class:special
	class:player={$settings.replaceAddressesWithPlayer && Boolean(player)}
	class:official={$settings.replaceAddressesWithKnown && verifiedEntry?.type === 'official'}
	class:shop={$settings.replaceAddressesWithKnown && verifiedEntry?.type === 'shop'}
	class:gamble={$settings.replaceAddressesWithKnown && verifiedEntry?.type === 'gamble'}
	class:company={$settings.replaceAddressesWithKnown && verifiedEntry?.type === 'company'}
	title={special ? 'Go to ' + address : undefined}
>
	{#if verifiedEntry && $settings.replaceAddressesWithKnown}
		{#if verifiedEntry.imageSrc}
			<img src={verifiedEntry.imageSrc} alt="Logo for {verifiedEntry.name}" />
		{:else if verifiedEntry.type === 'shop'}
			<FontAwesomeIcon icon={faStore} />
		{:else if verifiedEntry.type === 'gamble'}
			<FontAwesomeIcon icon={faDice} />
		{:else if verifiedEntry.type === 'company'}
			<FontAwesomeIcon icon={faBuilding} />
		{:else}
			<FontAwesomeIcon icon={faCheck} />
		{/if}
		{verifiedEntry.name}
	{:else if player && $settings.replaceAddressesWithPlayer}
		<img
			src="https://api.mineatar.io/face/{player.minecraftUUID}"
			alt="Avatar for {player.minecraftName}"
		/>
		{player.minecraftName}
	{:else}
		{address}
	{/if}
</a>

<button type="button" class="copy-address" onclick={copyAddress} aria-label="Copy Address">
	<FontAwesomeIcon icon={faCopy} />
</button>

<style>
	a {
		font-size: 1rem;
		flex-grow: 1;
		text-align: center;
	}

	a:not(.special) {
		font-size: 1.1em;
		font-family: monospace;
	}

	.player {
		--color: 255, 255, 255;
	}

	.official {
		--color: var(--green);
	}

	.shop {
		--color: var(--theme-color-rgb);
	}

	.company {
		--color: var(--theme-color-rgb);
	}

	.gamble {
		--color: var(--red);
	}

	.special {
		display: inline-flex;
		gap: 0.3em;
		align-items: center;
		color: white;
		white-space: nowrap;
		padding: 0.2em 0.4em;
		border-radius: 0.2em;
		text-decoration: none;
		transition: 0.2s background-color ease-in-out;
	}

	.special:hover,
	.special:focus-visible {
		background-color: rgba(var(--color), 0.1);
	}

	.special img {
		width: 0.9em;
		height: 0.9em;
		vertical-align: middle;
		border-radius: 0.15em;
	}

	.special :global(svg) {
		color: rgba(var(--color), 0.5);
	}

	.special img,
	.special :global(svg) {
		opacity: 0.8;
		transition: 0.25s;
	}

	.special:hover img,
	.special:hover :global(svg) {
		opacity: 1;
	}

	.copy-address {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.25);
		background-color: transparent;
		padding: 0;
		margin: 0;
		border: none;
		transition: 0.2s color ease-in-out;
		cursor: pointer;
	}

	.copy-address:hover,
	.copy-address:focus-visible {
		color: rgba(255, 255, 255, 0.4);
	}
</style>
