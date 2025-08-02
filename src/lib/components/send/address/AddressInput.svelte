<script lang="ts">
	import type { Address } from '$lib/api/types/Address';
	import kromer from '$lib/api/kromer';
	import type { APIError } from '$lib/api/types/APIError';

	let {
		loading = $bindable(),
		address = $bindable(),
		addClearHandler
	}: {
		loading: boolean;
		address: Address | null;
		addClearHandler?: (handler: () => void) => void;
	} = $props();

	let to = $state('');
	let addressError: string | null = $state(null);

	const verifyTo = async () => {
		loading = true;
		try {
			address = await kromer.resolve(to);
			addressError = null;
		} catch (e) {
			address = null;
			const err = e as APIError;
			addressError = err?.message ?? 'An unknown error occurred.';
		}
		loading = false;
	};

	if (addClearHandler) {
		addClearHandler(() => {
			to = '';
			addressError = null;
		});
	}
</script>

<label>
	To Address / Name
	<input type="text" bind:value={to} placeholder="ks0d5iqb6p" onblur={verifyTo} />
	{#if address}
		<small class="success">{address.address} has {address.balance} KRO</small>
	{:else if addressError}
		<small class="fail">{addressError}</small>
	{:else}
		<small>Unfocus from the field above to verify the address.</small>
	{/if}
</label>
