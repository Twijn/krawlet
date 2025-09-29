<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { faCopy, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import AddressSelector from '../addresses/AddressSelector.svelte';
	import { paramState } from '$lib/paramState.svelte';
	import MetaInput from './MetaInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import kromer from '$lib/api/kromer';
	import type { APIError, MakeTransactionBody } from 'kromer';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let loading: boolean = $state(false);

	let balances: Record<string, number> = $state({});

	let privatekey = $state('');
	let fromAddress = $state('');

	let to = paramState('to', '', {
		shouldSet: (v) => v.length > 0
	});
	let toAddress = $state('');

	let amount = paramState('amount', 0, {
		deserialize: (value: string) => Number(value),
		shouldSet: (v) => v > 0
	});

	let metadata = paramState('metadata', '', {
		shouldSet: (v) => v.length > 0
	});

	function copyPayCommand() {
		if (!to) {
			notifications.error('You must select a recipient!');
		} else if (amount.value === 0) {
			notifications.error('Transaction amount must be greater than 0!');
		} else {
			let command = `/pay ${to} ${amount.value} ${metadata.value}`.trim();
			navigator.clipboard.writeText(command).then(
				() => {
					notifications.success(`Copied '${command}' to clipboard!`);
				},
				(e) => {
					console.error(e);
					notifications.error('Failed to copy to clipboard.');
				}
			);
		}
	}

	function send(e: Event) {
		e.preventDefault();

		if (!privatekey) {
			notifications.error('You must input or select a private key!');
			return false;
		} else if (!to) {
			notifications.error('You must select a recipient!');
			return false;
		} else if (amount.value <= 0) {
			notifications.error('Transaction amount must be greater than 0!');
		} else {
			confirm.confirm({
				message: `Are you sure you want to send ${amount.value.toFixed(2)} KRO to ${toAddress}?`,
				confirmButtonLabel: 'Send',
				confirm: async () => {
					loading = true;
					try {
						const data: MakeTransactionBody = {
							privatekey,
							to: to.value,
							amount: amount.value
						};

						if (metadata.value && metadata.value.length > 0) {
							data.metadata = metadata.value;
						}

						await kromer.transactions.send(data);

						balances[fromAddress] = balances[fromAddress] - amount.value;
						balances[toAddress] = balances[toAddress] + amount.value;

						notifications.success('Transaction successful!');
					} catch (e) {
						const err = e as APIError;
						notifications.error(err.message ?? 'Unknown error. Please try again later.');
					}
					loading = false;
				}
			});
		}

		return false;
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faPaperPlane} /> Send Kromer</h2>
	<form method="POST">
		<ModuleLoading bind:loading absolute={true} />
		<div class="container">
			<div class="col-6 col-md-12">
				<AddressSelector
					label="Sender / From"
					mode="privatekey"
					bind:balances
					bind:privatekey
					bind:address={fromAddress}
				/>
			</div>
			<div class="col-6 col-md-12">
				<AddressSelector
					label="Recipient / To"
					bind:balances
					bind:query={to.value}
					bind:address={toAddress}
				/>
			</div>
			{#if fromAddress.length === 10 && fromAddress === toAddress}
				<div class="col-12 fail center">From address and to address must be different!</div>
			{/if}
		</div>
		<label>
			Amount
			<input
				type="number"
				name="amount"
				min="0.01"
				max={balances[fromAddress] ?? undefined}
				step="0.01"
				bind:value={amount.value}
			/>
		</label>
		<MetaInput bind:metadata={metadata.value} />
		<div class="buttons">
			<Button type="button" variant="secondary" full={true} onClick={copyPayCommand}>
				<FontAwesomeIcon icon={faCopy} />
				Copy /pay Command
			</Button>
			<Button type="submit" variant="primary" full={true} onClick={send}>
				<FontAwesomeIcon icon={faPaperPlane} />
				Send
			</Button>
		</div>
	</form>
</Section>

<style>
	form {
			position: relative;
	}
</style>
