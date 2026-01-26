<script lang="ts">
	import type { Transaction, TransactionMetadata, TransactionMetadataEntry, TransactionWithMeta } from 'kromer';
	import shopsync, { getItemImageUrl, getRelativeItemUrl } from '$lib/stores/shopsync';
	import type { Listing } from '$lib/types/shops';
	import settings from '$lib/stores/settings';
	import { onMount } from 'svelte';
	import { formatCurrency, relativeTime } from '$lib/util';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faRotateLeft, faArrowRight, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
	import { t$ } from '$lib/i18n';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import kromer from '$lib/api/kromer';
	import { goto } from '$app/navigation';

	const SPECIAL_META: string[] = ['winner', 'loser', 'payout'];
	const REFUND_INTERNAL_META: string[] = ['ref', 'type', 'amount', 'original'];

	const {
		transaction
	}: {
		transaction: TransactionWithMeta;
	} = $props();

	const meta = transaction.meta ?? { entries: [] };

	function findMeta(meta: TransactionMetadata, name: string): TransactionMetadataEntry | undefined {
		return meta.entries.find((entry) => entry.name.toLowerCase() === name);
	}

	function findDisplayMeta(meta: TransactionMetadata): TransactionMetadataEntry | undefined {
		return (
			findMeta(meta, 'error') ??
			findMeta(meta, 'message') ??
			findMeta(meta, 'msg') ??
			meta.entries.find((e) => !e.value)
		);
	}

	const displayMeta = findDisplayMeta(meta);

	// Check if this is a refund transaction
	const refundType = findMeta(meta, 'type');
	const isRefund = refundType?.value?.toLowerCase() === 'refund';
	const refundRef = findMeta(meta, 'ref');
	const refundOriginal = findMeta(meta, 'original');
	const refundAmount = findMeta(meta, 'amount');
	const refundMessage = findMeta(meta, 'message') ?? findMeta(meta, 'msg');
	const refundError = findMeta(meta, 'error');

	// Refund modal state
	let showRefundModal = $state(false);
	let referencedTransaction: Transaction | null = $state(null);
	let loadingRef = $state(false);

	function openRefundModal(e: MouseEvent) {
		e.preventDefault();
		showRefundModal = true;
		
		if (refundRef?.value && !referencedTransaction) {
			loadingRef = true;
			kromer.transactions.get(Number(refundRef.value))
				.then((tx) => {
					referencedTransaction = tx;
				})
				.catch((err) => {
					console.error('Failed to fetch referenced transaction:', err);
				})
				.finally(() => {
					loadingRef = false;
				});
		}
	}

	function navigateToTransaction(id: number) {
		showRefundModal = false;
		goto(`/transactions/${id}`);
	}

	let relatedListing: Listing | null = $state(null);
	let quantity: number = $state(0);

	onMount(() => {
		if ($settings.parsePurchaseItem) {
			const valueOnlyMeta = meta.entries.filter((e) => !e.value).map((e) => e.name.toLowerCase());
			if (valueOnlyMeta.length > 0) {
				const shops = $shopsync.data.filter((s) => s.addresses?.includes(transaction.to));
				const listings = shops.reduce((listings, s) => {
					if (s.items) {
						listings = [
							...listings,
							...s.items.filter((i) =>
								i.prices?.find(
									(p) =>
										p.currency.toLowerCase() === 'kro' &&
										valueOnlyMeta.includes(p.requiredMeta?.toLowerCase() ?? '')
								)
							)
						];
					}
					return listings;
				}, [] as Listing[]);
				if (listings.length > 0) {
					relatedListing = listings[0];
					if ($settings.parsePurchaseItemQuantity) {
						quantity = Math.floor(
							transaction.value /
								(relatedListing.prices?.find((p) => p.currency.toLowerCase() === 'kro')?.value ?? 1)
						);
					}
					if (listings.length > 1) {
						console.warn(
							'Multiple listings found for transaction metadata:',
							transaction,
							listings
						);
					}
				}
			}
		}
	});
</script>

<div class="metadata">
	{#if isRefund && refundRef}
		<div class="refund-container">
			<button class="refund-badge" onclick={openRefundModal}>
				<FontAwesomeIcon icon={faRotateLeft} />
				<span class="refund-id">#{refundRef.value}</span>
			</button>
			<!-- Show message/error/success after badge for refund transactions -->
			{#if refundError}
				<span class="refund-meta error">{refundError.value}</span>
			{:else if refundMessage}
				<span class="refund-meta">{refundMessage.value}</span>
			{:else}
				<!-- Check for success= or plain text after filtering refund internal fields -->
				{@const successMeta = findMeta(meta, 'success')}
				{@const plainText = meta.entries.find((e) => !e.value && !REFUND_INTERNAL_META.includes(e.name.toLowerCase()))}
				{#if successMeta}
					<span class="refund-meta success">{successMeta.value}</span>
				{:else if plainText}
					<span class="refund-meta">{plainText.name}</span>
				{/if}
			{/if}
		</div>
	{:else if meta.entries.find((x) => SPECIAL_META.includes(x.name.toLowerCase()))}
		{#each meta.entries.filter( (x) => SPECIAL_META.includes(x.name.toLowerCase()) ) as entry (entry.name + ':' + entry.value)}
			{@const name = entry.name.toLowerCase()}
			{@const payout = Number(entry.value)}
			{#if name === 'payout' && !isNaN(payout) && payout > 0}
				<span class="comp comp-payout">
					{payout.toFixed(2)} <small>KRO</small>
				</span>
			{:else}
				<span
					class="comp"
					class:comp-winner={name === 'winner'}
					class:comp-loser={name === 'loser'}
				>
					{entry.value ?? '?'}
				</span>
			{/if}
		{/each}
	{:else if relatedListing}
		<a class="item" href={getRelativeItemUrl(relatedListing)}>
			<img
				src={getItemImageUrl(relatedListing)}
				alt="Item icon for {relatedListing.itemDisplayName}"
			/>
			<div class="item-info">
				<strong
					>{relatedListing.itemDisplayName}
					<small>{quantity > 0 ? `x${quantity.toLocaleString()}` : ''}</small></strong
				>
				{#if $settings.parsePurchaseItemQuantity && relatedListing?.prices}
					{@const price = relatedListing.prices.find((p) => p.currency.toLowerCase() === 'kro')}
					{#if price}
						<div class="each">{formatCurrency(price.value)} KRO each</div>
					{/if}
				{/if}
			</div>
		</a>
	{:else if displayMeta}
		{@const isError = displayMeta.name.toLowerCase() === 'error'}
		{@const isMessage = ['message', 'msg'].includes(displayMeta.name.toLowerCase())}
		<span class="display-meta" class:error={isError} class:message={isMessage}>
			{#if displayMeta.name.toLowerCase() === 'error'}
				<strong>Error: </strong>
			{:else if ['message', 'msg'].includes(displayMeta.name.toLowerCase())}
				<strong>Message: </strong>
			{/if}
			{displayMeta.value ? displayMeta.value : displayMeta.name}
		</span>
	{:else}
		<small>[No message]</small>
	{/if}
</div>

<!-- Refund Details Modal -->
{#if isRefund && refundRef}
	<Modal open={showRefundModal} title={$t$('refund.refundTransaction')} onClose={() => showRefundModal = false} maxWidth="550px">
		<div class="refund-modal-content">
			<!-- This Transaction (the refund) -->
			<div class="refund-section">
				<h3>{$t$('transaction.thisTransaction')}</h3>
				<div class="tx-card current">
					<div class="tx-header">
						<button class="tx-id" onclick={() => navigateToTransaction(transaction.id)}>#{transaction.id}</button>
						<span class="tx-amount refund-amount">+{formatCurrency(transaction.value)} KRO</span>
					</div>
					<div class="tx-parties">
						{#if transaction.from}
							<span class="tx-address"><Address address={transaction.from} /></span>
						{:else}
							<span class="tx-address mined">Mined</span>
						{/if}
						<span class="tx-arrow"><FontAwesomeIcon icon={faArrowRight} /></span>
						<span class="tx-address"><Address address={transaction.to} /></span>
					</div>
					<div class="tx-time">{relativeTime(transaction.time)}</div>
				</div>
			</div>

			<!-- Refund Summary -->
			{#if refundOriginal}
				{@const originalValue = Number(refundOriginal.value)}
				{@const percentage = (transaction.value / originalValue) * 100}
				<div class="refund-summary">
					<div class="summary-row">
						<span class="summary-label">{$t$('refund.originalAmount')}</span>
						<span class="summary-value">{formatCurrency(originalValue)} KRO</span>
					</div>
					<div class="summary-row">
						<span class="summary-label">{$t$('refund.refundAmount')}</span>
						<span class="summary-value refund">{formatCurrency(transaction.value)} KRO</span>
					</div>
					<div class="summary-row">
						<span class="summary-label">{$t$('refund.refundPercentage')}</span>
						<span class="summary-value percentage" class:full={percentage >= 100}>{percentage.toFixed(1)}%</span>
					</div>
				</div>
			{/if}

			<!-- Message or Error -->
			{#if refundError}
				<div class="refund-message error">
					<strong>Error:</strong> {refundError.value}
				</div>
			{:else if refundMessage}
				<div class="refund-message">
					<strong>{$t$('refund.message')}:</strong> {refundMessage.value}
				</div>
			{:else if displayMeta && !displayMeta.value}
				<div class="refund-message">
					{displayMeta.name}
				</div>
			{/if}

			<!-- Original Transaction -->
			<div class="refund-section">
				<h3>{$t$('refund.transactionToRefund')}</h3>
				{#if loadingRef}
					<Skeleton width="100%" height="90px" />
				{:else if referencedTransaction}
					{@const refTxId = referencedTransaction.id}
					<div class="tx-card original">
						<div class="tx-header">
							<button class="tx-id" onclick={() => navigateToTransaction(refTxId)}>#{referencedTransaction.id}</button>
							<span class="tx-amount">{formatCurrency(referencedTransaction.value)} KRO</span>
						</div>
						<div class="tx-parties">
							{#if referencedTransaction.from}
								<span class="tx-address"><Address address={referencedTransaction.from} /></span>
							{:else}
								<span class="tx-address mined">Mined</span>
							{/if}
							<span class="tx-arrow"><FontAwesomeIcon icon={faArrowRight} /></span>
							<span class="tx-address"><Address address={referencedTransaction.to} /></span>
						</div>
						<div class="tx-time">{relativeTime(referencedTransaction.time)}</div>
						{#if referencedTransaction.metadata}
							{@const refMeta = kromer.transactions.parseMetadata(referencedTransaction)}
							{@const refDisplayMeta = findDisplayMeta(refMeta)}
							{@const refPlainText = refMeta.entries.find((e) => !e.value && !REFUND_INTERNAL_META.includes(e.name.toLowerCase()))}
							{#if refDisplayMeta}
								<div class="tx-meta">
									<small class:error={refDisplayMeta.name.toLowerCase() === 'error'}>
										{#if refDisplayMeta.name.toLowerCase() === 'error'}
											<strong>Error:</strong> {refDisplayMeta.value}
										{:else if ['message', 'msg'].includes(refDisplayMeta.name.toLowerCase())}
											{refDisplayMeta.value}
										{:else}
											{refDisplayMeta.value ?? refDisplayMeta.name}
										{/if}
									</small>
								</div>
							{:else if refPlainText}
								<div class="tx-meta">
									<small>{refPlainText.name}</small>
								</div>
							{/if}
						{/if}
					</div>
				{:else}
					<div class="tx-card error">
						<span>Could not load transaction #{refundRef.value}</span>
					</div>
				{/if}
			</div>

			<div class="modal-actions">
				<Button variant="secondary" onClick={() => navigateToTransaction(transaction.id)}>
					<FontAwesomeIcon icon={faExternalLinkAlt} />
					{$t$('contextMenu.viewTransaction')}
				</Button>
			</div>
		</div>
	</Modal>
{/if}

<style>
	.metadata span {
		display: block;
		max-width: 100%;
		overflow: hidden;
	}

	.refund-container {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
	}

	.refund-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.2em 0.5em;
		background-color: rgba(var(--yellow), 0.15);
		border: 1px solid rgba(var(--yellow), 0.3);
		border-radius: 0.3em;
		color: rgb(var(--yellow));
		text-decoration: none;
		font-size: 0.85em;
		font-family: inherit;
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;
		flex-shrink: 0;
	}

	.refund-badge:hover {
		background-color: rgba(var(--yellow), 0.25);
		border-color: rgba(var(--yellow), 0.5);
	}

	.refund-id {
		font-weight: 600;
	}

	.refund-meta {
		color: var(--text-color-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.refund-meta.error {
		color: rgb(var(--red));
	}

	.refund-meta.success {
		color: rgb(var(--green));
	}

	.metadata span.error {
		--message-color: var(--red);
	}

	.metadata span.message {
		--message-color: var(--blue);
	}

	.display-meta {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	span.message strong,
	span.error strong {
		font-weight: 600;
		color: rgb(var(--message-color));
	}

	.display-meta:not(.error):not(.message) {
		color: var(--text-color-2);
		font-style: italic;
	}

	.metadata span.comp-winner {
		--title: 'Winner';
		--color: var(--green);
	}

	.metadata span.comp-loser {
		--title: 'Loser';
		--color: var(--red);
	}

	.metadata span.comp-payout {
		--title: 'Payout';
		--color: var(--blue);
	}

	.metadata span.comp {
		display: inline-block;
		background-color: rgba(var(--color), 0.1);
		padding: 0.2em 0.4em;
		border-radius: 0.2em;
		margin: -0.4em 0.2em -0.4em 0;
		font-size: 0.9em;
		text-align: center;
		font-weight: bold;
	}

	.metadata span.comp::before {
		content: '';
		display: block;
		font-size: 0.6em;
		text-transform: uppercase;
	}

	.metadata span.comp::before {
		content: var(--title);
		color: rgb(var(--color));
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.25em;
		color: white;
		text-decoration: none;
	}

	.item img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}

	.each {
		font-size: 0.8em;
		opacity: 0.8;
	}

	/* Refund Modal Styles */
	.refund-modal-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.refund-section h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-color-2);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.tx-card {
		padding: 1rem;
		background-color: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
	}

	.tx-card.current {
		border-color: rgba(var(--yellow), 0.4);
		background-color: rgba(var(--yellow), 0.05);
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
		font-size: 1.1em;
	}

	.tx-amount.refund-amount {
		color: rgb(var(--green));
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
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tx-meta small {
		color: var(--text-color-2);
		word-break: break-all;
	}

	.refund-summary {
		padding: 1rem;
		background-color: rgba(var(--yellow), 0.08);
		border: 1px solid rgba(var(--yellow), 0.2);
		border-radius: 0.5rem;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0;
	}

	.summary-row:not(:last-child) {
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.summary-label {
		color: var(--text-color-2);
		font-size: 0.9em;
	}

	.summary-value {
		font-weight: 600;
	}

	.summary-value.refund {
		color: rgb(var(--green));
	}

	.summary-value.percentage {
		padding: 0.15em 0.4em;
		background-color: rgba(var(--blue), 0.15);
		border-radius: 0.25em;
		color: rgb(var(--blue));
		font-size: 0.9em;
	}

	.summary-value.percentage.full {
		background-color: rgba(var(--green), 0.15);
		color: rgb(var(--green));
	}

	.refund-message {
		padding: 0.75rem 1rem;
		background-color: rgba(var(--blue), 0.1);
		border: 1px solid rgba(var(--blue), 0.2);
		border-radius: 0.4rem;
		font-size: 0.9em;
		color: var(--text-color);
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

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>
