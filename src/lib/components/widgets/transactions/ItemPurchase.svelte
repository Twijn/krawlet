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
	import Address from '../addresses/Address.svelte';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import { onMount } from 'svelte';
	import {formatCurrency} from '$lib/util';

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

	onMount(() => {
		if (to.value && to.value.length === 10) {
			kromer.addresses.get(to.value).then((addr) => {
				balances[addr.address] = addr.balance;
			}).catch(() => {
				// Ignore
			});
		}
	});

	let lock = paramState('lock', false, {
		deserialize: (value: string) => value === 'true',
		shouldSet: v => v
	});

	let to = paramState('to', '', {
		shouldSet: (v) => v.length > 0
	});

	let unitPrice = paramState('unit_price', 0, {
		deserialize: (value: string) => Number(value),
		shouldSet: (v) => v > 0
	});

	let quantity = paramState('quantity', 1, {
		deserialize: (value: string) => Number(value),
		shouldSet: (v) => v > 0 && v <= maxQuantity.value
	});

	const amount = $derived(unitPrice.value * quantity.value);

	let maxQuantity = paramState('max_quantity', Infinity, {
		deserialize: (value: string) => Number(value),
		shouldSet: (v) => v > 0
	});

	let metadata = paramState('metadata', '', {
		shouldSet: (v) => v.length > 0
	});

	function copyPayCommand() {
		if (!to.value) {
			notifications.error('You must select a recipient!');
		} else if (amount === 0) {
			notifications.error('Transaction amount must be greater than 0!');
		} else {
			let command = `/pay ${to.value} ${amount} ${metadata.value}`.trim();
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
		} else if (!to.value) {
			notifications.error('You must select a recipient!');
			return false;
		} else if (amount <= 0) {
			notifications.error('Transaction amount must be greater than 0!');
		} else {
			confirm.confirm({
				message: `Are you sure you want to send ${amount.toFixed(2)} KRO to ${to.value}?`,
				confirmButtonLabel: 'Send',
				confirm: async () => {
					loading = true;
					try {
						const data: MakeTransactionBody = {
							privatekey,
							to: to.value,
							amount
						};

						if (metadata.value && metadata.value.length > 0) {
							data.metadata = metadata.value;
						}

						await kromer.transactions.send(data);

						notifications.success('Transaction successful!');

						balances[fromAddress] = balances[fromAddress] - amount;
						balances[to.value] = balances[to.value] + amount;
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

	let priceText = $derived(`${formatCurrency(unitPrice.value)} KRO ea. * ${quantity.value ?? 0} = ${formatCurrency(amount)} KRO`);
</script>

{#if unitPrice.value <= 0}
	<div class="col-12">
		<Alert variant="danger">
			Please provide a unit price in the "unit_price" query parameter to send a purchase.
		</Alert>
	</div>
{:else if to.value && to.value.length === 10 && typeof(balances[to.value]) === "number"}
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
					<p class="recipient-text">Recipient / To</p>
					<Address bind:address={to.value} />
				</div>
				{#if fromAddress.length === 10 && fromAddress === to.value}
					<div class="col-12 fail center">From address and to address must be different!</div>
				{/if}
			</div>
			<label>
				Quantity
				<input
					type="number"
					name="amount"
					min="1"
					max={maxQuantity.value}
					step="1"
					bind:value={quantity.value}
				/>
				{#if quantity.value > maxQuantity.value}
					<small class="fail">
						Quantity must be less than or equal to {maxQuantity.value}.
					</small>
				{:else}
					<strong>Max Quantity:</strong>
					<code>{maxQuantity.value}</code>
				{/if}
			</label>
			<label>
				Price
				<input
					type="text"
					name="price"
					bind:value={priceText}
					disabled
				/>
			</label>
			<MetaInput bind:metadata={metadata.value} bind:lock={lock.value} />
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
{:else}
	<div class="col-12">
		<Alert variant="danger">
			Please provide a recipient address in the "to" query parameter to send kromer.
		</Alert>
	</div>
{/if}

<style>
	form {
		position: relative;
	}

	.recipient-text {
		margin: 0 0 .5em 0;
	}
</style>
