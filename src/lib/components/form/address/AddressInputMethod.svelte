<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Address } from 'kromer';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import AddressInput from '$lib/components/form/address/AddressInput.svelte';
	import PlayerInput from '$lib/components/form/address/PlayerInput.svelte';
	import ShopInput from '$lib/components/form/address/ShopInput.svelte';
	import { paramState } from '$lib/paramState.svelte.js';

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
		<AddressInput bind:loading bind:address {queryPrefix} addClearHandler={addHandler} />
	</div>
{:else if type.value === 'minecraft'}
	<div transition:slide>
		<PlayerInput bind:loading bind:address {queryPrefix} addClearHandler={addHandler} />
	</div>
{:else if type.value === 'shop'}
	<div transition:slide>
		<ShopInput bind:loading bind:address {queryPrefix} addClearHandler={addHandler} />
	</div>
{/if}
