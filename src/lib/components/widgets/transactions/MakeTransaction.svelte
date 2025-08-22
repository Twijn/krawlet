<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import kromer from '$lib/api/kromer';
	import type { Address, APIError, MakeTransactionBody } from 'kromer';
	import { paramState } from '$lib/paramState.svelte.js';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import PrivateKeyInputMethod from '$lib/components/form/privatekey/PrivateKeyInputMethod.svelte';
	import AddressInputMethod from '$lib/components/form/address/AddressInputMethod.svelte';

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

	let lock = paramState('lock', false, {
		shouldSet: (value) => value,
		deserialize: (value: string) => value === 'true',
		serialize: (value: boolean) => (value ? 'true' : 'false')
	});

	let loading: boolean = $state(false);

	let privatekey: string = $state('');
	let fromAddress: Address | null = $state(null);

	let toAddress: Address | null = $state(null);

	// Metadata
	let metadata = paramState('metadata', '', {
		shouldSet: (value) => value.length > 0
	});

	// Amount & sending
	let amount = paramState('amount', 0, {
		deserialize: (value: string) => Number(value),
		shouldSet: (value) => value > 0
	});

	const send = async (e: Event) => {
		e.preventDefault();

		confirm.confirm({
			message: `Are you sure you want to send ${amount.value.toFixed(2)} KRO to ${toAddress?.address}?`,
			confirmButtonLabel: 'Send',
			confirm: async () => {
				if (!fromAddress) {
					notifications.error('Invalid private key!');
					return false;
				} else if (!toAddress) {
					notifications.error('Invalid recipient!');
					return false;
				} else if (amount.value > fromAddress.balance) {
					notifications.error("You don't have enough money to send that amount!");
					return false;
				} else if (amount.value <= 0) {
					notifications.error('Nice try!');
					return false;
				} else {
					loading = true;
					try {
						const data: MakeTransactionBody = {
							privatekey,
							to: toAddress?.address,
							amount: amount.value
						};

						if (metadata.value && metadata.value.length > 0) {
							data.metadata = metadata.value;
						}

						await kromer.transactions.send(data);

						notifications.success('Transaction successful!');
					} catch (e) {
						const err = e as APIError;
						notifications.error(err.message ?? 'Unknown error. Please try again later.');
					}
					loading = false;
				}
			},
			cancel: () => {
				notifications.warning('Transaction cancelled.');
			}
		});

		return false;
	};
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faPaperPlane} /> Send Kromer</h2>
	<form method="POST">
		<ModuleLoading absolute={true} {loading} />
		<fieldset>
			<legend>From</legend>
			<PrivateKeyInputMethod bind:loading bind:privatekey bind:address={fromAddress} />
		</fieldset>

		<fieldset>
			<legend>To</legend>
			<AddressInputMethod bind:loading bind:address={toAddress} queryPrefix="to_" />
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
					bind:value={amount.value}
				/>
			</label>
			<label>
				Metadata
				<input type="text" bind:value={metadata.value} disabled={lock.value} />
				{#if lock.value}
					<small>Metadata has been locked by the recipient.</small>
				{/if}
			</label>
		</fieldset>
		<Button
			type="submit"
			full={true}
			disabled={!fromAddress || !toAddress || amount.value === 0}
			onClick={send}
		>
			Send
			{#if amount.value > 0}
				{amount.value.toFixed(2)} KRO
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
