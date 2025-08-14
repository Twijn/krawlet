<script lang="ts">
	import kromer from '$lib/api/kromer';
	import type { Address, APIError } from 'kromer';
	import { paramState } from '$lib/paramState.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

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

	let to = paramState(`${queryPrefix}address`, '', {
		shouldSet: (value) => Boolean(value.length > 0 && address)
	});
	let addressError: string | null = $state(null);

	const verifyTo = async () => {
		loading = true;
		try {
			address = await kromer.addresses.resolve(to.value);
			addressError = null;
		} catch (e) {
			address = null;
			const err = e as APIError;
			addressError = err?.message ?? 'An unknown error occurred.';
		}
		loading = false;
	};

	onMount(() => {
		if (browser && to.value.length > 0) {
			verifyTo();
		}
	});

	if (addClearHandler) {
		addClearHandler(() => {
			to.value = '';
			addressError = null;
		});
	}
</script>

<label>
	To Address / Name
	<input
		type="text"
		bind:value={to.value}
		placeholder="ks0d5iqb6p"
		onblur={verifyTo}
		onkeyup={() => (address = null)}
	/>
	{#if address}
		<small class="success">{address.address} has {address.balance} KRO</small>
	{:else if addressError}
		<small class="fail">{addressError}</small>
	{:else}
		<small>Unfocus from the field above to verify the address.</small>
	{/if}
</label>
