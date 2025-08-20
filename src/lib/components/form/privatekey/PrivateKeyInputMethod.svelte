<script lang="ts">
	import { slide } from 'svelte/transition';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import PrivateKeyInput from '$lib/components/form/privatekey/PrivateKeyInput.svelte';
	import WalletPrivateKey from '$lib/components/form/privatekey/WalletPrivateKey.svelte';
	import type { Address } from 'kromer';

	let {
		loading = $bindable(),
		privatekey = $bindable(),
		address = $bindable(),
		minimumBalance = $bindable(0.01)
	}: {
		loading: boolean;
		privatekey: string;
		address: Address | null;
		minimumBalance?: number;
	} = $props();

	const options = [
		{
			id: 'wallet',
			name: 'Wallet'
		},
		{
			id: 'raw',
			name: 'Raw Private Key'
		}
	];

	let type: string = $state('wallet');

	let clearHandlers: (() => void)[] = [];

	const clearTo = () => {
		privatekey = '';
		address = null;
		clearHandlers.forEach((x) => x());
	};

	const addHandler = (handler: () => void) => {
		clearHandlers.push(handler);
	};
</script>

<ButtonSelect vertical={false} {options} bind:selected={type} change={clearTo} />
{#if type === 'wallet'}
	<div transition:slide>
		<WalletPrivateKey bind:loading bind:privatekey bind:address addClearHandler={addHandler} />
	</div>
{:else if type === 'raw'}
	<div transition:slide>
		<PrivateKeyInput bind:loading bind:privatekey bind:address />
	</div>
{/if}

{#if address}
	{#if address.balance >= minimumBalance}
		<small class="success"
			>Authentication successful! Logged in as {address.address} with {address.balance.toFixed(2)}
			KRO</small
		>
	{:else}
		<small class="fail"
			>Authentication was successful, but {address.address}
			{minimumBalance === 0.01
				? 'has no money!'
				: `doesn't have enough money (Needs ${minimumBalance} KRO)!`}</small
		>
	{/if}
{/if}
