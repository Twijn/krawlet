<script lang="ts">
	import type {
		Transaction,
		TransactionMetadata,
		TransactionMetadataEntry,
		TransactionWithMeta
	} from 'kromer';
	import { goto } from '$app/navigation';
	import kromer from '$lib/api/kromer';
	import { t$ } from '$lib/i18n';
	import { formatCurrency, relativeTime } from '$lib/util';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faArrowRight, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

	const REFUND_INTERNAL_META: string[] = ['ref', 'type', 'original'];

	let {
		transaction,
		open = $bindable(false)
	}: {
		transaction: TransactionWithMeta;
		open?: boolean;
	} = $props();

	let referencedTransaction: Transaction | null = $state(null);
	let loadingRef = $state(false);

	function findMetaIn(
		meta: TransactionMetadata,
		name: string
	): TransactionMetadataEntry | undefined {
		return meta.entries.find((entry) => entry.name.toLowerCase() === name);
	}

	function findDisplayMetaIn(meta: TransactionMetadata): TransactionMetadataEntry | undefined {
		return (
			findMetaIn(meta, 'error') ??
			findMetaIn(meta, 'message') ??
			findMetaIn(meta, 'msg') ??
			meta.entries.find((e) => !e.value)
		);
	}

	const meta = $derived(transaction.meta ?? { entries: [] });
	const refundRef = $derived(findMetaIn(meta, 'ref'));
	const refundOriginal = $derived(findMetaIn(meta, 'original'));
	const refundMessage = $derived(findMetaIn(meta, 'message') ?? findMetaIn(meta, 'msg'));
	const refundError = $derived(findMetaIn(meta, 'error'));
	const displayMeta = $derived(findDisplayMetaIn(meta));

	const originalValue = $derived.by(() => {
		if (!refundOriginal?.value) return null;
		const parsed = Number(refundOriginal.value);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
	});

	const percentage = $derived.by(() => {
		if (!originalValue) return null;
		return (transaction.value / originalValue) * 100;
	});

	$effect(() => {
		if (!open || !refundRef?.value || referencedTransaction || loadingRef) return;

		loadingRef = true;
		kromer.transactions
			.get(Number(refundRef.value))
			.then((tx) => {
				referencedTransaction = tx;
			})
			.catch((err) => {
				console.error('Failed to fetch referenced transaction:', err);
			})
			.finally(() => {
				loadingRef = false;
			});
	});

	function closeModal() {
		open = false;
	}

	function navigateToTransaction(id: number) {
		closeModal();
		goto(`/transactions/${id}`);
	}
</script>

<Modal {open} title={$t$('refund.refundTransaction')} onClose={closeModal} maxWidth="520px">
	<div class="refund-modal-content">
		{#if originalValue}
			<div class="summary-metrics">
				<div class="summary-metric">
					<span class="metric-label">{$t$('refund.originalAmount')}</span>
					<strong class="metric-value">{formatCurrency(originalValue)} KRO</strong>
				</div>
				<div class="summary-metric">
					<span class="metric-label">{$t$('refund.refundAmount')}</span>
					<div class="metric-value-row">
						<strong class="metric-value">{formatCurrency(transaction.value)} KRO</strong>
						<Tag variant={percentage === 100 ? 'green' : 'gray'}>
							{percentage ? `${percentage.toFixed(2)}%` : 'N/A'}
						</Tag>
					</div>
				</div>
			</div>
		{/if}

		{#if refundError}
			<div class="refund-message error">
				<strong>Error:</strong>
				{refundError.value}
			</div>
		{:else if refundMessage}
			<div class="refund-message">
				<strong>{$t$('refund.message')}:</strong>
				{refundMessage.value}
			</div>
		{:else if displayMeta && !displayMeta.value}
			<div class="refund-message">
				{displayMeta.name}
			</div>
		{/if}

		{#if refundRef}
			<div class="linked-section">
				<h3>{$t$('refund.transactionToRefund')}</h3>
				{#if loadingRef}
					<Skeleton width="100%" height="90px" />
				{:else if referencedTransaction}
					{@const refTx = referencedTransaction}
					<div class="tx-card">
						<div class="tx-header">
							<button class="tx-id" onclick={() => navigateToTransaction(refTx.id)}
								>#{refTx.id}</button
							>
							<span class="tx-amount">{formatCurrency(refTx.value)} KRO</span>
						</div>
						<div class="tx-parties">
							{#if refTx.from}
								<span class="tx-address"><Address address={refTx.from} /></span>
							{:else}
								<span class="tx-address mined">Mined</span>
							{/if}
							<span class="tx-arrow"><FontAwesomeIcon icon={faArrowRight} /></span>
							<span class="tx-address"><Address address={refTx.to} /></span>
						</div>
						<div class="tx-time">{relativeTime(refTx.time)}</div>
						{#if refTx.metadata}
							{@const refMeta = kromer.transactions.parseMetadata(refTx)}
							{@const refDisplayMeta = findDisplayMetaIn(refMeta)}
							{@const refPlainText = refMeta.entries.find(
								(e) => !e.value && !REFUND_INTERNAL_META.includes(e.name.toLowerCase())
							)}
							{#if refDisplayMeta}
								<small class="tx-meta" class:error={refDisplayMeta.name.toLowerCase() === 'error'}>
									{#if refDisplayMeta.name.toLowerCase() === 'error'}
										<strong>Error:</strong> {refDisplayMeta.value}
									{:else if ['message', 'msg'].includes(refDisplayMeta.name.toLowerCase())}
										{refDisplayMeta.value}
									{:else}
										{refDisplayMeta.value ?? refDisplayMeta.name}
									{/if}
								</small>
							{:else if refPlainText}
								<small class="tx-meta">{refPlainText.name}</small>
							{/if}
						{/if}
					</div>
				{:else}
					<div class="tx-card error">
						<span>Could not load transaction #{refundRef.value}</span>
					</div>
				{/if}
			</div>
		{/if}

		<div class="modal-actions">
			<Button variant="secondary" onClick={() => navigateToTransaction(transaction.id)}>
				<FontAwesomeIcon icon={faExternalLinkAlt} />
				{$t$('contextMenu.viewTransaction')}
			</Button>
		</div>
	</div>
</Modal>

<style>
	.refund-modal-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.summary-metrics {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.55rem;
	}

	.summary-metric {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.7rem 0.75rem;
		border-radius: 0.45rem;
		background-color: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.metric-label {
		font-size: 0.76rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-color-2);
	}

	.metric-value {
		display: inline-block;
		font-size: 1rem;
		line-height: 1.2;
		font-weight: 700;
	}

	.metric-value-row {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.metric-value-row :global(.tag) {
		transform: translateY(-1px);
	}

	@media (max-width: 520px) {
		.summary-metrics {
			grid-template-columns: 1fr;
		}
	}

	.refund-message {
		padding: 0.7rem 0.85rem;
		background-color: rgba(var(--blue), 0.1);
		border: 1px solid rgba(var(--blue), 0.2);
		border-radius: 0.4rem;
		font-size: 0.9em;
	}

	.refund-message.error {
		background-color: rgba(var(--red), 0.1);
		border-color: rgba(var(--red), 0.3);
	}

	.refund-message.error strong {
		color: rgb(var(--red));
	}

	.refund-message strong {
		color: rgb(var(--blue));
	}

	.linked-section h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-color-2);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.tx-card {
		padding: 0.85rem;
		background-color: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
	}

	.tx-card.error {
		border-color: rgba(var(--red), 0.4);
		background-color: rgba(var(--red), 0.05);
		color: rgb(var(--red));
	}

	.tx-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.tx-id {
		font-weight: 600;
		color: rgb(var(--primary));
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		font-size: inherit;
		font-family: inherit;
		cursor: pointer;
	}

	.tx-id:hover {
		text-decoration: underline;
	}

	.tx-amount {
		font-weight: 600;
	}

	.tx-parties {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9em;
		flex-wrap: wrap;
	}

	.tx-arrow {
		color: var(--text-color-2);
		opacity: 0.6;
	}

	.tx-address.mined {
		font-style: italic;
		color: var(--text-color-2);
	}

	.tx-time {
		margin-top: 0.5rem;
		font-size: 0.85em;
		color: var(--text-color-2);
	}

	.tx-meta {
		display: block;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--text-color-2);
		word-break: break-all;
	}

	.tx-meta.error strong {
		color: rgb(var(--red));
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>
