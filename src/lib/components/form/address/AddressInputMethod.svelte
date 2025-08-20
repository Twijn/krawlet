<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Address } from 'kromer';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import { paramState } from '$lib/paramState.svelte.js';
	import RawAddressInput from '$lib/components/form/address/RawAddressInput.svelte';
	import PlayerAddressInput from '$lib/components/form/address/PlayerAddressInput.svelte';
	import ShopAddressInput from '$lib/components/form/address/ShopAddressInput.svelte';

	let {
		loading = $bindable(),
		address = $bindable(),
		queryPrefix = ''
	}: {
		loading: boolean;
		address: Address | null;
		queryPrefix?: string;
	} = $props();

	const options = [
		{
			id: 'address',
			name: 'Address / Name'
		},
		{
			id: 'minecraft',
			name: 'Minecraft User'
		},
		{
			id: 'shop',
			name: 'Shop'
		}
	];

	let type = paramState(`${queryPrefix}type`, options[0].id, {
		shouldSet: (value) => value !== options[0].id && Boolean(options.find((x) => x.id === value))
	});

	let clearHandlers: (() => void)[] = [];

	const clearTo = () => {
		address = null;
		clearHandlers.forEach((x) => x());
	};

	const addHandler = (handler: () => void) => {
		clearHandlers.push(handler);
	};
</script>

<ButtonSelect vertical={false} {options} bind:selected={type.value} change={clearTo} />
{#if type.value === 'address'}
	<div transition:slide>
		<RawAddressInput bind:loading bind:address {queryPrefix} addClearHandler={addHandler} />
	</div>
{:else if type.value === 'minecraft'}
	<div transition:slide>
		<PlayerAddressInput bind:loading bind:address {queryPrefix} addClearHandler={addHandler} />
	</div>
{:else if type.value === 'shop'}
	<div transition:slide>
		<ShopAddressInput bind:loading bind:address {queryPrefix} addClearHandler={addHandler} />
	</div>
{/if}
