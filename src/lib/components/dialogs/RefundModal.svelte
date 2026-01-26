<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { t$ } from '$lib/i18n';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import { refundModal } from '$lib/stores/refundModal';
	import kromer from '$lib/api/kromer';
	import type { APIError } from 'kromer';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import AddressSelector from '$lib/components/widgets/addresses/AddressSelector.svelte';

	let refundFromAddress: string = $state('');
	let privateKey = $state('');
	let fromQuery = $state('');
	let refundMode: 'amount' | 'percentage' = $state('percentage');
	let refundAmount = $state(0);
	let refundPercentage = $state(100);
	let message = $state('');
	let submitting = $state(false);
	let loading = $state(false);
	let balances: Record<string, number> = $state({});

	// Reset form when modal opens
	$effect(() => {
		if ($refundModal.open && $refundModal.transaction) {
			refundFromAddress = '';
			privateKey = '';
			fromQuery = $refundModal.transaction.to || '';
			refundMode = 'percentage';
			refundAmount = $refundModal.transaction.value;
			refundPercentage = 100;
			message = $t$('refund.defaultMessage', { id: $refundModal.transaction.id });
			loading = false;
			balances = {};
		}
	});

	let calculatedRefund = $derived.by(() => {
		if (!$refundModal.transaction) return 0;
		if (refundMode === 'percentage') {
			return (
				Math.floor(($refundModal.transaction.value * refundPercentage) / 100 * 100) / 100
			);
		}
		return Math.floor(refundAmount * 100) / 100;
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		const transaction = $refundModal.transaction;
		if (!transaction || !transaction.from) {
			notifications.error($t$('refund.error'));
			return;
		}

		if (!privateKey || !refundFromAddress) {
			notifications.error($t$('refund.selectWallet'));
			return;
		}

		if (calculatedRefund <= 0) {
			notifications.error($t$('refund.invalidAmount'));
			return;
		}

		if (calculatedRefund > transaction.value) {
			notifications.error($t$('refund.exceedsMaximum'));
			return;
		}

		if (calculatedRefund > (balances[refundFromAddress] ?? 0)) {
			notifications.error($t$('errors.insufficientFunds'));
			return;
		}

		submitting = true;
		
		try {
			// Build metadata with reference
			const metadata = `ref=${transaction.id};type=refund;amount=${calculatedRefund};original=${transaction.value};message=${message}`;

			await kromer.transactions.send({
				privatekey: privateKey,
				to: transaction.from!,
				amount: calculatedRefund,
				metadata
			});

			notifications.success($t$('refund.success'));
			refundModal.close();
		} catch (e) {
			const err = e as APIError;
			notifications.error(err.message ?? $t$('refund.error'));
		} finally {
			submitting = false;
		}
	}

	function handleClose() {
		const transaction = $refundModal.transaction;
		if (
			privateKey ||
			(transaction && message !== $t$('refund.defaultMessage', { id: transaction.id }))
		) {
			confirm.confirm({
				message: $t$('wallet.confirmCloseWithData'),
				danger: true,
				confirmButtonLabel: $t$('common.close'),
				confirm: () => {
					refundModal.close();
				}
			});
		} else {
			refundModal.close();
		}
	}
</script>

<Modal open={$refundModal.open} title={$t$('refund.refundTransaction')} onClose={handleClose}>
	<form method="POST" onsubmit={handleSubmit}>
		{#if $refundModal.transaction}
			{@const transaction = $refundModal.transaction}
			<div class="transaction-info">
				<div class="info-header">{$t$('refund.transactionToRefund')}</div>
				<div class="transaction-details">
					<div class="detail-row">
						<span class="detail-label">{$t$('transaction.id')}</span>
						<span class="detail-value">
							<code>#{transaction.id}</code>
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">{$t$('refund.originalAmount')}</span>
						<span class="detail-value amount">{transaction.value.toFixed(2)} KRO</span>
					</div>
					{#if transaction.from}
						<div class="detail-row">
							<span class="detail-label">{$t$('transaction.sender')}</span>
							<span class="detail-value">
								<Address address={transaction.from} />
							</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="wallet-selector">
				<AddressSelector 
					label={$t$('refund.refundFrom')}
					mode="privatekey"
					bind:query={fromQuery}
					bind:balances
					bind:privatekey={privateKey}
					bind:address={refundFromAddress}
				/>
			</div>

			<label>
				{$t$('refund.refundMode')}
				<div class="mode-selector">
					<button
						type="button"
						class="mode-btn"
						class:active={refundMode === 'percentage'}
						onclick={() => (refundMode = 'percentage')}
					>
						{$t$('refund.percentage')}
					</button>
					<button
						type="button"
						class="mode-btn"
						class:active={refundMode === 'amount'}
						onclick={() => (refundMode = 'amount')}
					>
						{$t$('refund.amount')}
					</button>
				</div>
			</label>

			{#if refundMode === 'percentage'}
				<label>
					{$t$('refund.refundPercentage')}
					<input
						type="number"
						min="0"
						max="100"
						step="1"
						bind:value={refundPercentage}
						required
					/>
					<small>0% - 100%</small>
				</label>
			{:else}
				<label>
					{$t$('refund.refundAmount')}
					<input
						type="number"
						min="0"
						max={transaction.value}
						step="0.01"
						bind:value={refundAmount}
						required
					/>
					<small>{$t$('common.maximum')}: {transaction.value.toFixed(2)} KRO</small>
				</label>
			{/if}

			<div class="calculated-refund">
				<strong>{$t$('refund.refundAmount')}:</strong>
				<span class="amount">{calculatedRefund.toFixed(2)} KRO</span>
			</div>

			<label>
				{$t$('refund.message')}
				<input type="text" bind:value={message} maxlength="255" />
			</label>

			<div class="modal-buttons">
				<Button type="button" variant="secondary" onClick={handleClose}>
					{$t$('common.cancel')}
				</Button>
				<Button type="submit" variant="primary" disabled={submitting || !refundFromAddress || loading}>
					{submitting ? $t$('refund.processing') : $t$('common.confirm')}
				</Button>
			</div>
		{/if}
	</form>
</Modal>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.transaction-info {
		padding: 1.25rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.5rem;
		border-left: 3px solid var(--theme-color);
	}

	.info-header {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-color-2);
		margin-bottom: 1rem;
	}

	.transaction-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		align-items: center;
	}

	.detail-label {
		font-size: 0.875rem;
		color: var(--text-color-2);
		white-space: nowrap;
	}

	.detail-value {
		font-size: 0.9375rem;
		color: var(--text-color-1);
		text-align: right;
		word-break: break-all;
	}

	.detail-value.amount {
		font-weight: 700;
		font-size: 1rem;
		color: rgb(var(--theme-color-rgb));
	}

	.transaction-details code {
		font-family: 'Courier New', monospace;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	.wallet-selector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.text-button {
		background: none;
		border: none;
		color: rgb(var(--theme-color-rgb));
		font-size: 0.9375rem;
		font-weight: 500;
		padding: 0.5rem;
		cursor: pointer;
		text-align: center;
		text-decoration: underline;
		transition: opacity 0.2s ease;
	}

	.text-button:hover {
		opacity: 0.8;
	}

	.text-button:active {
		opacity: 0.6;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: var(--text-color-1);
		font-weight: 500;
	}

	input {
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		background: rgba(0, 0, 0, 0.2);
		color: var(--text-color-1);
		font-size: 1rem;
		transition: border-color 0.2s ease;
	}

	input:focus {
		outline: none;
		border-color: var(--theme-color);
	}

	input.error {
		border-color: #ff4444;
		background: rgba(255, 68, 68, 0.1);
	}

	input.error:focus {
		border-color: #ff6666;
	}

	small {
		font-size: 0.875rem;
		color: var(--text-color-2);
		font-weight: normal;
	}

	small.error-message {
		color: #ff6666;
		font-weight: 500;
	}

	.mode-selector {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		background: rgba(0, 0, 0, 0.2);
		padding: 0.25rem;
		border-radius: 0.5rem;
	}

	.mode-btn {
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 0.35rem;
		color: var(--text-color-2);
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.mode-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-color-1);
	}

	.mode-btn.active {
		background: rgba(var(--theme-color-rgb), 0.25);
		color: rgb(var(--theme-color-rgb));
	}

	.calculated-refund {
		padding: 0.75rem 1rem;
		background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.15) 0%, rgba(var(--theme-color-rgb), 0.05) 100%);
		border-radius: 0.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: 1px solid rgba(var(--theme-color-rgb), 0.3);
	}

	.calculated-refund strong {
		color: var(--text-color-2);
	}

	.calculated-refund .amount {
		font-size: 1.25rem;
		font-weight: 700;
		color: rgb(var(--theme-color-rgb));
	}

	.modal-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
