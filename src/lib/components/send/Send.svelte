<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import Button from '$lib/components/Button.svelte';
	import AddressSelector from '$lib/components/send/address/AddressSelector.svelte';
	import kromer from '$lib/api/kromer';
	import type { Address, APIError, MakeTransactionBody } from 'kromer';
	import PrivateKeySelector from '$lib/components/send/privatekey/PrivateKeySelector.svelte';

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

	let privatekey: string = $state('');
	let fromAddress: Address | null = $state(null);

	let toAddress: Address | null = $state(null);

	// Metadata
	let metadata: string = $state('');

	// Amount & sending
	let amount: number = $state(0);

	const send = async (e: Event) => {
		e.preventDefault();
		if (
			confirm(`Are you sure you want to send ${amount.toFixed(2)} KRO to ${toAddress?.address}?`)
		) {
			if (!fromAddress) {
				alert('Invalid private key!');
				return false;
			} else if (!toAddress) {
				alert('Invalid recipient!');
				return false;
			} else if (amount > fromAddress.balance) {
				alert("You don't have enough money to send that amount!");
				return false;
			} else if (amount <= 0) {
				alert('Nice try!');
				return false;
			} else {
				loading = true;
				try {
					const data: MakeTransactionBody = {
						privatekey,
						to: toAddress?.address,
						amount
					};

					if (metadata && metadata.length > 0) {
						data.metadata = metadata;
					}

					await kromer.transactions.send(data);

					alert('Transaction successful!');
				} catch (e) {
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
		<fieldset>
			<legend>From</legend>
			<PrivateKeySelector bind:loading bind:privatekey bind:address={fromAddress} />
		</fieldset>

		<fieldset>
			<legend>To</legend>
			<AddressSelector bind:loading bind:address={toAddress} />
		</fieldset>

		<fieldset>
			<legend>Amount &amp; Metadata</legend>
			<label>
				Amount
				<input
					type="number"
					min="0"
					max={fromAddress?.balance ?? 0}
					step="0.01"
					bind:value={amount}
				/>
			</label>
			<label>
				Metadata
				<input type="text" bind:value={metadata} />
			</label>
		</fieldset>
		<Button
			type="submit"
			full={true}
			disabled={!fromAddress || !toAddress || amount === 0}
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

	fieldset {
		border: none;
		margin: 0;
		padding: 0.4em 0;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	legend {
		color: white;
		text-align: center;
		font-size: 0.9em;
		font-weight: 500;
		opacity: 0.5;
		padding: 0 0.75em;
	}
</style>
