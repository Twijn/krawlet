<script lang="ts">
	import type { Address } from '$lib/api/types/Address';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import ButtonSelect from '$lib/components/ButtonSelect.svelte';
	import { type Player, playerWalletStore } from '$lib/playerWallets';
	import { onDestroy } from 'svelte';
	import kromer from '$lib/api/kromer';

	let {
		loading = $bindable(),
		address = $bindable(),
		addClearHandler
	}: {
		loading: boolean;
		address: Address | null;
		addClearHandler?: (handler: () => void) => void;
	} = $props();

	let playerUUID: string = $state('');
	let playerFilter: string = $state('');

	let players: Player[] = $derived(
		$playerWalletStore.players.filter((x) =>
			x.minecraftName.toLowerCase().includes(playerFilter.toLowerCase())
		) ?? []
	);

	let selectedPlayer: Player | null = $derived(
		players.find((x) => x.minecraftUUID === playerUUID) ?? null
	);

	onDestroy(playerWalletStore.destroy);

	// "To" address authentication

	$effect(() => {
		if (selectedPlayer?.kromerAddress) {
			loading = true;
			kromer
				.address({
					address: selectedPlayer.kromerAddress
				})
				.then((addr) => {
					loading = false;
					address = addr;
				});
		}
	});

	if (addClearHandler) {
		addClearHandler(() => {
			playerUUID = '';
		});
	}
</script>

{#if players.length > 0}
	<label for="filter-player">Select Player</label>
	<input
		type="text"
		id="filter-player"
		bind:value={playerFilter}
		placeholder="Type to filter players..."
	/>
	<ButtonSelect
		vertical={true}
		options={players
			.map((x) => {
				return {
					id: x.minecraftUUID,
					name: x.online ? `${x.minecraftName} - Online` : x.minecraftName
				};
			})
			.filter((x, i) => i < 10)}
		bind:selected={playerUUID}
	/>
	{#if address && selectedPlayer?.kromerAddress}
		<small class="success">{selectedPlayer.minecraftName} has {address.balance} KRO</small>
	{/if}
{:else}
	<ModuleLoading />
{/if}
