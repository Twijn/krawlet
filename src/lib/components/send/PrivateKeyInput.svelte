<script lang="ts">
	import type { Address } from '$lib/api/types/Address';
	import kromer from '$lib/api/kromer';

	let {
		loading = $bindable(),
		privatekey = $bindable(),
		address = $bindable(),
	}: {
		loading: boolean,
		privatekey: string,
		address: Address | null,
	} = $props();

	let authFailed: boolean = $state(false);

	const verifyKey = async () => {
		authFailed = false;
		address = null;
		if (privatekey.length < 8) return;
		loading = true;
		const response = await kromer.login(privatekey);
		if (response.ok && response.authed && response.address) {
			address = await kromer.address({
				address: response.address
			});
		} else {
			authFailed = true;
		}
		loading = false;
	};
</script>

<label>
	Private Key
	<input type="password" bind:value={privatekey} onblur={verifyKey} />
	{#if address}
		{#if address.balance > 0}
			<small class="success"
				>Authentication successful! Logged in as {address.address} with {address.balance.toFixed(
					2
				)} KRO</small
			>
		{:else}
			<small class="fail"
				>Authentication was successful, but {address.address} has no money!</small
			>
		{/if}
	{:else if authFailed}
		<small class="fail">Authentication failed!</small>
	{:else}
		<small
			>Unfocus from the field above to verify your key. Key must have at least 8 characters.</small
		>
	{/if}
</label>