<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { faCopy, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import AddressSelector from '../addresses/AddressSelector.svelte';
	import { paramState } from '$lib/paramState.svelte';
	import MetadataMode from './MetadataMode.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import kromer from '$lib/api/kromer';
	import type { APIError, MakeTransactionBody } from 'kromer';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
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

	let from = paramState('from', '', {
		shouldSet: (v) => v.length > 0
	});
	let fromQuery = $state(from.value);

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
		if (!to.value) {
			notifications.error($t$('transaction.selectRecipient'));
		} else if (amount.value === 0) {
			notifications.error($t$('transaction.amountMustBePositive'));
		} else {
			let command = `/pay ${to.value} ${amount.value} ${metadata.value}`.trim();
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
		} else if (!to) {
			notifications.error($t$('transaction.selectRecipient'));
			return false;
		} else if (amount.value <= 0) {
			notifications.error($t$('transaction.amountMustBePositive'));
		} else {
			confirm.confirm({
				message: $t$('transaction.confirmSend', {
					amount: amount.value.toFixed(2),
					address: toAddress
				}),
				confirmButtonLabel: $t$('transaction.sendButton'),
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

						notifications.success($t$('transaction.transactionSuccess'));
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
</script>

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
					bind:query={fromQuery}
				/>
			</div>
			<div class="col-6 col-md-12">
				<AddressSelector
					label={$t$('transaction.recipientTo')}
					bind:balances
					bind:query={to.value}
					bind:address={toAddress}
				/>
			</div>
			{#if fromAddress.length === 10 && fromAddress === toAddress}
				<div class="col-12 fail center">{$t$('transaction.addressMismatch')}</div>
			{/if}
		</div>
		<label>
			{$t$('transaction.amount')}
			<input
				type="number"
				name="amount"
				min="0.01"
				max={balances[fromAddress] ?? undefined}
				step="0.01"
				bind:value={amount.value}
			/>
			<button
				type="button"
				class="link"
				onclick={() => (amount.value = balances[fromAddress] ?? 0)}
			>
				{$t$('transaction.setMaxAmount')}
			</button>
		</label>
		<MetadataMode bind:metadata={metadata.value} fromAddress={fromAddress} />
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

<style>
	form {
		position: relative;
	}
</style>
