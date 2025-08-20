<script lang="ts">
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import { type Player, playerWalletStore } from '$lib/playerWallets';
	import { onDestroy } from 'svelte';
	import kromer from '$lib/api/kromer';
	import type { Address } from 'kromer';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import { paramState } from '$lib/paramState.svelte.js';

	let {
		loading = $bindable(),
		address = $bindable(),
		queryPrefix = '',
		addClearHandler
	}: {
		loading: boolean;
		address: Address | null;
		queryPrefix?: string;
		addClearHandler?: (handler: () => void) => void;
	} = $props();

	let playerUUID = paramState(`${queryPrefix}player_uuid`, '', {
		shouldSet: (value) => value.length > 0
	});
	let playerFilter: string = $state('');

	let players: Player[] = $derived(
		$playerWalletStore.players.filter((x) =>
			x.minecraftName.toLowerCase().includes(playerFilter.toLowerCase())
		) ?? []
	);

	let selectedPlayer: Player | null = $derived(
		players.find((x) => x.minecraftUUID === playerUUID.value) ?? null
	);

	onDestroy(playerWalletStore.destroy);

	// "To" address authentication

	$effect(() => {
		if (selectedPlayer?.kromerAddress) {
			loading = true;
			kromer.addresses.get(selectedPlayer.kromerAddress).then((addr) => {
				loading = false;
				address = addr;
			});
		}
	});

	if (addClearHandler) {
		addClearHandler(() => {
			playerUUID.value = '';
		});
	}
</script>

<label for="filter-player">Select Player</label>
<input
	type="text"
	id="filter-player"
	bind:value={playerFilter}
	placeholder="Type to filter players..."
/>

{#if players.length > 0}
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
		bind:selected={playerUUID.value}
	/>
	{#if address && selectedPlayer?.kromerAddress}
		<small class="success">{selectedPlayer.minecraftName} has {address.balance} KRO</small>
	{/if}
{:else}
	<Alert variant="danger">No players were found!</Alert>
{/if}
