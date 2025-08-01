<script lang="ts">
	import { onDestroy } from 'svelte';

	import { type Player, playerWalletStore } from '$lib/playerWallets';
	import { verified, type VerifiedEntry } from '$lib/verified';

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
	class:player={Boolean(player)}
	class:verified={Boolean(verifiedEntry)}
>
	{#if verifiedEntry}
		{#if verifiedEntry.imageSrc}
			<img src={verifiedEntry.imageSrc} alt="Logo for {verifiedEntry.name}" />
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
	a:not(.player, .verified) {
		font-size: 1.1em;
		font-family: monospace;
	}

	.player {
		--color: 255, 255, 255;
	}

	.verified {
		--color: var(--green);
	}

	.player,
	.verified {
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

	.player:hover,
	.player:focus-visible,
	.verified:hover,
	.verified:focus-visible {
		background-color: rgba(var(--color), 0.2);
	}

	.player img,
	.verified img {
		width: 1em;
		height: 1em;
		vertical-align: middle;
	}
</style>
