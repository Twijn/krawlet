<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import {
		faCopy,
		faPaperPlane,
		faChevronDown,
		faChevronUp
	} from '@fortawesome/free-solid-svg-icons';
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
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

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
	let showAdvanced: boolean = $state(false);

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

	// Override values from MetadataMode (e.g., for actions)
	let metadataOverrideAddress = $state('');
	let metadataOverrideAmount = $state(0);
	let fieldsLocked = $state(false);

	// beforeSend callback from MetadataMode (for pre-send validation like API health checks)
	let beforeSend: (() => Promise<{ success: boolean; error?: string }>) | null = $state(null);

	// Effective values (use override if set)
	let effectiveTo = $derived(metadataOverrideAddress || to.value);
	let effectiveAmount = $derived(
		metadataOverrideAmount > 0 ? metadataOverrideAmount : amount.value
	);

	// Auto-expand advanced when metadata is present or fields are locked
	$effect(() => {
		if (metadata.value || fieldsLocked) {
			showAdvanced = true;
		}
	});

	function copyPayCommand() {
		if (!effectiveTo) {
			notifications.error($t$('transaction.selectRecipient'));
		} else if (effectiveAmount === 0) {
			notifications.error($t$('transaction.amountMustBePositive'));
		} else {
			let command = `/pay ${effectiveTo} ${effectiveAmount} ${metadata.value}`.trim();
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
		} else if (!effectiveTo) {
			notifications.error($t$('transaction.selectRecipient'));
			return false;
		} else if (effectiveAmount <= 0) {
			notifications.error($t$('transaction.amountMustBePositive'));
		} else {
			const targetAddress = metadataOverrideAddress || toAddress;
			confirm.confirm({
				message: $t$('transaction.confirmSend', {
					amount: effectiveAmount.toFixed(2),
					address: targetAddress
				}),
				confirmButtonLabel: $t$('transaction.sendButton'),
				confirm: async () => {
					loading = true;
					try {
						// Run beforeSend hook if provided (e.g., API health check)
						if (beforeSend) {
							const result = await beforeSend();
							if (!result.success) {
								notifications.error(result.error ?? $t$('transaction.beforeSendFailed'));
								loading = false;
								return;
							}
						}

						const data: MakeTransactionBody = {
							privatekey,
							to: effectiveTo,
							amount: effectiveAmount
						};

						if (metadata.value && metadata.value.length > 0) {
							data.metadata = metadata.value;
						}

						await kromer.transactions.send(data);

						balances[fromAddress] = balances[fromAddress] - effectiveAmount;
						balances[targetAddress] = (balances[targetAddress] ?? 0) + effectiveAmount;

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

		<!-- Wallet & Recipient Section -->
		<div class="form-section">
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
						disabled={fieldsLocked}
						lockedValue={metadataOverrideAddress}
					/>
				</div>
				{#if fromAddress.length === 10 && fromAddress === toAddress}
					<div class="col-12 fail center">{$t$('transaction.addressMismatch')}</div>
				{/if}
			</div>
		</div>

		<!-- Amount Section -->
		<div class="form-section">
			<label>
				{$t$('transaction.amount')}
				<input
					type="number"
					name="amount"
					min="0.01"
					max={fieldsLocked ? undefined : (balances[fromAddress] ?? undefined)}
					step="0.01"
					value={fieldsLocked ? effectiveAmount : amount.value}
					oninput={(e) => !fieldsLocked && (amount.value = Number(e.currentTarget.value))}
					disabled={fieldsLocked}
				/>
				{#if !fieldsLocked}
					<button
						type="button"
						class="link"
						onclick={() => (amount.value = balances[fromAddress] ?? 0)}
					>
						{$t$('transaction.setMaxAmount')}
					</button>
				{/if}
			</label>
		</div>

		<!-- Advanced Options (Metadata) -->
		<div class="form-section advanced-section">
			<button type="button" class="advanced-toggle" onclick={() => (showAdvanced = !showAdvanced)}>
				<span>{$t$('transaction.advanced')}</span>
				<FontAwesomeIcon icon={showAdvanced ? faChevronUp : faChevronDown} />
			</button>
			{#if showAdvanced}
				<div transition:slide={{ duration: 200, easing: cubicOut }}>
					<MetadataMode
						bind:metadata={metadata.value}
						{fromAddress}
						bind:overrideAddress={metadataOverrideAddress}
						bind:overrideAmount={metadataOverrideAmount}
						bind:fieldsLocked
						bind:beforeSend
					/>
				</div>
			{/if}
		</div>

		<!-- Action Buttons -->
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

	.form-section {
		margin-bottom: 1.5rem;
	}

	.form-section:last-of-type {
		margin-bottom: 1rem;
	}

	.advanced-section {
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.advanced-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.65rem 0.875rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		color: var(--text-color-2);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		margin-bottom: 0.75rem;
	}

	.advanced-toggle:hover {
		background: rgba(0, 0, 0, 0.3);
		border-color: rgba(255, 255, 255, 0.12);
		color: var(--text-color-1);
		transform: translateY(-1px);
	}

	.advanced-toggle:active {
		transform: translateY(0);
	}

	.advanced-toggle :global(svg) {
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	.advanced-toggle:hover :global(svg) {
		opacity: 1;
	}
</style>
