<script lang="ts">
	import { onDestroy } from 'svelte';

	import { type Player, playerWalletStore } from '$lib/playerWallets';
	import { verified, type VerifiedEntry } from '$lib/verified';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBuilding, faDice, faStore } from '@fortawesome/free-solid-svg-icons';

	const {
		address
	}: {
		address: string;
	} = $props();

	let player: Player | null = $derived(
		$playerWalletStore.players.find((x) => x.kromerAddress === address) ?? null
	);

	onDestroy(playerWalletStore.destroy);

	let verifiedEntry: VerifiedEntry | null = $derived(verified[address] ?? null);
</script>

<a
	href="/addresses/{address}"
	class:special={player || verifiedEntry}
	class:player={Boolean(player)}
	class:official={verifiedEntry?.type === 'official'}
	class:shop={verifiedEntry?.type === 'shop'}
	class:gamble={verifiedEntry?.type === 'gamble'}
	class:company={verifiedEntry?.type === 'company'}
	title={verifiedEntry || player ? address : undefined}
>
	{#if verifiedEntry}
		{#if verifiedEntry.imageSrc}
			<img src={verifiedEntry.imageSrc} alt="Logo for {verifiedEntry.name}" />
		{:else if verifiedEntry.type === 'shop'}
			<FontAwesomeIcon icon={faStore} />
		{:else if verifiedEntry.type === 'gamble'}
			<FontAwesomeIcon icon={faDice} />
		{:else if verifiedEntry.type === 'company'}
			<FontAwesomeIcon icon={faBuilding} />
		{/if}
		{verifiedEntry.name}
	{:else if player}
		<img
			src="https://api.mineatar.io/face/{player.minecraftUUID}"
			alt="Avatar for {player.minecraftName}"
		/>
		{player.minecraftName}
	{:else}
		{address}
	{/if}
</a>

<style>
	a {
		font-size: 1rem;
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
		display: inline-block;
		background-color: rgba(var(--color), 0.1);
		border: 1px solid rgba(var(--color), 0.2);
		color: white;
		white-space: nowrap;
		padding: 0.2em 0.4em;
		border-radius: 0.2em;
		text-decoration: none;
		transition: 0.2s background-color ease-in-out;
	}

	.special:hover,
	.special:focus-visible {
		background-color: rgba(var(--color), 0.2);
	}

	.special img {
		width: 1em;
		height: 1em;
		vertical-align: middle;
	}
</style>
