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
	import { formatCurrency } from '$lib/util';
	import { t$ } from '$lib/i18n';

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
			kromer.addresses
				.get(to.value)
				.then((addr) => {
					balances[addr.address] = addr.balance;
				})
				.catch(() => {
					// Ignore
				});
		}
	});

	let lock = paramState('lock', false, {
		deserialize: (value: string) => value === 'true',
		shouldSet: (v) => v
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
			notifications.error($t$('transaction.selectRecipient'));
		} else if (amount === 0) {
			notifications.error($t$('transaction.amountMustBePositive'));
		} else {
			let command = `/pay ${to.value} ${amount} ${metadata.value}`.trim();
			navigator.clipboard.writeText(command).then(
				() => {
					notifications.success($t$('transaction.payCommandCopied', { command }));
				},
				(e) => {
					console.error(e);
					notifications.error($t$('transaction.copyFailed'));
				}
			);
		}
	}

	function send(e: Event) {
		e.preventDefault();

		if (!privatekey) {
			notifications.error($t$('transaction.inputPrivateKey'));
			return false;
		} else if (!to.value) {
			notifications.error($t$('transaction.selectRecipient'));
			return false;
		} else if (amount <= 0) {
			notifications.error($t$('transaction.amountMustBePositive'));
		} else {
			confirm.confirm({
				message: $t$('transaction.confirmSend', { amount: amount.toFixed(2), address: to.value }),
				confirmButtonLabel: $t$('transaction.sendButton'),
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

						notifications.success($t$('transaction.transactionSuccess'));

						balances[fromAddress] = balances[fromAddress] - amount;
						balances[to.value] = balances[to.value] + amount;
					} catch (e) {
						const err = e as APIError;
						notifications.error(err.message ?? $t$('transaction.unknownError'));
					}
					loading = false;
				}
			});
		}

		return false;
	}

	let priceText = $derived(
		`${formatCurrency(unitPrice.value)} KRO ea. * ${quantity.value ?? 0} = ${formatCurrency(amount)} KRO`
	);
</script>

{#if unitPrice.value <= 0}
	<div class="col-12">
		<Alert variant="danger">
			{$t$('transaction.unitPriceRequired')}
		</Alert>
	</div>
{:else if to.value && to.value.length === 10 && typeof balances[to.value] === 'number'}
	<Section {lgCols} {mdCols} {smCols}>
		<h2><FontAwesomeIcon icon={faPaperPlane} /> {$t$('transaction.sendKromer')}</h2>
		<form method="POST">
			<ModuleLoading bind:loading absolute={true} />
			<div class="container">
				<div class="col-6 col-md-12">
					<AddressSelector
						label={$t$('transaction.senderFrom')}
						mode="privatekey"
						bind:balances
						bind:privatekey
						bind:address={fromAddress}
					/>
				</div>
				<div class="col-6 col-md-12">
					<p class="recipient-text">{$t$('transaction.recipientTo')}</p>
					<Address bind:address={to.value} />
				</div>
				{#if fromAddress.length === 10 && fromAddress === to.value}
					<div class="col-12 fail center">{$t$('transaction.addressMismatch')}</div>
				{/if}
			</div>
			<label>
				{$t$('transaction.quantity')}
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
						{$t$('transaction.quantityExceeded', { max: maxQuantity.value })}
					</small>
				{:else}
					<strong>{$t$('transaction.maxQuantity')}:</strong>
					<code>{maxQuantity.value}</code>
				{/if}
			</label>
			<label>
				{$t$('transaction.price')}
				<input type="text" name="price" bind:value={priceText} disabled />
			</label>
			<MetaInput bind:metadata={metadata.value} bind:lock={lock.value} />
			<div class="buttons">
				<Button type="button" variant="secondary" full={true} onClick={copyPayCommand}>
					<FontAwesomeIcon icon={faCopy} />
					{$t$('transaction.copyPayCommand')}
				</Button>
				<Button type="submit" variant="primary" full={true} onClick={send}>
					<FontAwesomeIcon icon={faPaperPlane} />
					{$t$('transaction.sendButton')}
				</Button>
			</div>
		</form>
	</Section>
{:else}
	<div class="col-12">
		<Alert variant="danger">
			{$t$('transaction.recipientRequired')}
		</Alert>
	</div>
{/if}

<style>
	form {
		position: relative;
	}

	.recipient-text {
		margin: 0 0 0.5em 0;
	}
</style>
