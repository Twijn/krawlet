<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import kromer from '$lib/api/kromer';
	import type { Address } from '$lib/api/types/Address';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { APIError } from '$lib/api/types/APIError';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = null,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let loading: boolean = $state(false);

	// Private key authentication
	let privatekey: string = $state('');
	let authFailed: boolean = $state(false);
	let address: Address | null = $state(null);

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

	// "To" address authentication
	let to = $state('');
	let toAddress: Address | null = $state(null);
	let toAddressError: string|null = $state(null);

	const verifyTo = async () => {
		loading = true;
		try {
			toAddress = await kromer.resolve(to);
			toAddressError = null;
		} catch(e) {
			toAddress = null;
			const err = e as APIError;
			toAddressError = err?.message ?? "An unknown error occurred.";
		}
		loading = false;
	};

	// Amount & sending
	let amount: number = $state(0);

	const send = async (e: Event) => {
		e.preventDefault();
		if (
			confirm(`Are you sure you want to send ${amount.toFixed(2)} KRO to ${toAddress?.address}?`)
		) {
			if (!address) {
				alert('Invalid private key!');
				return false;
			} else if (!toAddress) {
				alert('Invalid recipient!');
				return false;
			} else if (amount > address.balance) {
				alert("You don't have enough money to send that amount!");
				return false;
			} else if (amount <= 0) {
				alert('Nice try!');
				return false;
			} else {
				loading = true;
				try {
					await kromer.send({
						privatekey,
						to: toAddress?.address,
						amount: amount
					});

					alert("Transaction successful!");
				} catch(e) {
					const err = e as APIError;
					alert(err.message);
				}
				loading = false;
			}
		}
		return false;
	};
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faPaperPlane} /> Send Kromer</h2>
	<form method="POST">
		<ModuleLoading absolute={true} {loading} />
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
		<label>
			To Address / Name
			<input type="text" bind:value={to} onblur={verifyTo} />
			{#if toAddress}
				<small class="success">{toAddress.address} has {toAddress.balance} KRO</small>
			{:else if toAddressError}
				<small class="fail">{toAddressError}</small>
			{:else}
				<small>Unfocus from the field above to verify the "to" address.</small>
			{/if}
		</label>
		<label>
			Amount
			<input type="number" min="0" max={address?.balance ?? 0} step="0.01" bind:value={amount} />
		</label>
		<Button
			type="submit"
			full={true}
			disabled={!address || !toAddress || amount === 0}
			onClick={send}
		>
			Send
			{#if amount > 0}
				{amount.toFixed(2)} KRO
			{/if}
		</Button>
	</form>
</Section>

<style>
	form {
		position: relative;
	}

	.success {
		color: rgb(var(--green));
	}

	.fail {
		color: rgb(var(--red));
	}
</style>
