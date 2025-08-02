<script lang="ts">
	import { slide } from 'svelte/transition';
	import ButtonSelect from '$lib/components/ButtonSelect.svelte';
	import type { Address } from '$lib/api/types/Address';
	import AddressInput from '$lib/components/send/address/AddressInput.svelte';
	import PlayerInput from '$lib/components/send/address/PlayerInput.svelte';
	import ShopInput from '$lib/components/send/address/ShopInput.svelte';

	let {
		loading = $bindable(),
		address = $bindable()
	}: {
		loading: boolean;
		address: Address | null;
	} = $props();

	const toOptions = [
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

	let toType: string = $state('address');

	let clearHandlers: (() => void)[] = [];

	const clearTo = () => {
		address = null;
		clearHandlers.forEach((x) => x());
	};

	const addHandler = (handler: () => void) => {
		clearHandlers.push(handler);
	};
</script>

<ButtonSelect vertical={false} options={toOptions} bind:selected={toType} change={clearTo} />
{#if toType === 'address'}
	<div transition:slide>
		<AddressInput bind:loading bind:address addClearHandler={addHandler} />
	</div>
{:else if toType === 'minecraft'}
	<div transition:slide>
		<PlayerInput bind:loading bind:address addClearHandler={addHandler} />
	</div>
{:else if toType === 'shop'}
	<div transition:slide>
		<ShopInput bind:loading bind:address addClearHandler={addHandler} />
	</div>
{/if}
