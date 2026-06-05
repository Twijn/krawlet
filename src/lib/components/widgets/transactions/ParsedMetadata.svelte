<script lang="ts">
	import type { TransactionMetadata, TransactionMetadataEntry, TransactionWithMeta } from 'kromer';
	import shopsync, { getItemImageUrl, getRelativeItemUrl } from '$lib/stores/shopsync';
	import type { Listing } from '$lib/types/shops';
	import settings from '$lib/stores/settings';
	import { formatCurrency, getMinecraftAvatar } from '$lib/util';
	import { findBestRelatedShopSyncListing } from '$lib/utils/shopsyncMatching';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
	import { t$ } from '$lib/i18n';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import Placeholder from '$lib/components/ui/Placeholder.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import RefundTransactionModal from '$lib/components/widgets/transactions/RefundTransactionModal.svelte';

	const SPECIAL_META: string[] = ['winner', 'loser', 'payout'];
	const REFUND_INTERNAL_META: string[] = ['ref', 'type', 'original'];

	const {
		transaction = $bindable()
	}: {
		transaction: TransactionWithMeta;
	} = $props();

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

	// Check for shop actions (set or delete shop info)
	const shopNameMeta = $derived(findMetaIn(meta, 'shop_name'));
	const shopDescriptionMeta = $derived(findMetaIn(meta, 'shop_description'));
	const shopDeleteMeta = $derived(
		meta.entries.find((e) => e.name.toLowerCase() === 'shop_delete' && !e.value)
	);
	const isShopAction = $derived(shopNameMeta || shopDescriptionMeta || shopDeleteMeta);
	const isSetShopInfo = $derived(shopNameMeta || shopDescriptionMeta);
	const isDeleteShopInfo = $derived(shopDeleteMeta && !isSetShopInfo);

	// Check for player data
	const userUuidMeta = $derived(findMetaIn(meta, 'useruuid'));
	const usernameMeta = $derived(findMetaIn(meta, 'username'));
	const returnMeta = $derived(findMetaIn(meta, 'return'));
	const hasPlayerData = $derived(userUuidMeta || usernameMeta);

	const displayMeta = $derived(findDisplayMetaIn(meta));

	// Check if this is a refund transaction
	const refundType = $derived(findMetaIn(meta, 'type'));
	const isRefund = $derived(refundType?.value?.toLowerCase() === 'refund');
	const refundRef = $derived(findMetaIn(meta, 'ref'));
	const refundMessage = $derived(findMetaIn(meta, 'message') ?? findMetaIn(meta, 'msg'));
	const refundError = $derived(findMetaIn(meta, 'error'));

	let showRefundModal = $state(false);

	function openRefundModal(e: MouseEvent) {
		e.preventDefault();
		showRefundModal = true;
	}

	const relatedMatch: ReturnType<typeof findBestRelatedShopSyncListing> = $derived.by(() => {
		if (!$settings.parsePurchaseItem) return null;

		const valueOnlyMeta = meta.entries.filter((e) => !e.value).map((e) => e.name.toLowerCase());
		return findBestRelatedShopSyncListing(transaction, $shopsync.data, valueOnlyMeta);
	});

	const relatedListing: Listing | null = $derived(relatedMatch?.listing ?? null);
	const relatedPrice = $derived(relatedMatch?.price ?? null);

	const quantity: number = $derived.by(() => {
		if (!relatedPrice || !$settings.parsePurchaseItemQuantity) return 0;
		if (relatedPrice.value <= 0) return 0;
		return Math.floor(transaction.value / relatedPrice.value);
	});
</script>

<div class="metadata">
	{#if isRefund && refundRef}
		<div class="refund-container">
			<button class="refund-trigger" onclick={openRefundModal}>
				<Tag variant="yellow" size="md">
					<FontAwesomeIcon icon={faRotateLeft} />
					#{refundRef.value}
				</Tag>
			</button>
			<!-- Show message/error/success after badge for refund transactions -->
			{#if refundError}
				<span class="refund-meta error">{refundError.value}</span>
			{:else if refundMessage}
				<span class="refund-meta">{refundMessage.value}</span>
			{:else}
				<!-- Check for success= or plain text after filtering refund internal fields -->
				{@const successMeta = findMetaIn(meta, 'success')}
				{@const plainText = meta.entries.find(
					(e) => !e.value && !REFUND_INTERNAL_META.includes(e.name.toLowerCase())
				)}
				{#if successMeta}
					<span class="refund-meta success">{successMeta.value}</span>
				{:else if plainText}
					<span class="refund-meta">{plainText.name}</span>
				{/if}
			{/if}
		</div>
	{:else if isShopAction}
		<!-- Shop Actions: Set or Delete Shop Info -->
		<div class="action-container">
			{#if isDeleteShopInfo}
				<Tag variant="red">{$t$('parsedMeta.deleteShopInfo')}</Tag>
			{:else if isSetShopInfo}
				<Tag variant="blue">{$t$('parsedMeta.setShopInfo')}</Tag>
				{#if shopNameMeta?.value}
					<span class="action-detail">{shopNameMeta.value}</span>
				{/if}
			{/if}
		</div>
	{:else if hasPlayerData}
		<!-- Player Data Display -->
		<div class="player-container">
			{#if userUuidMeta?.value}
				<img
					class="player-avatar"
					src={getMinecraftAvatar(userUuidMeta.value)}
					alt="Player avatar"
				/>
			{/if}
			<Tag variant="green">
				{#if usernameMeta?.value}
					{usernameMeta.value}
				{:else}
					{$t$('parsedMeta.playerData')}
				{/if}
			</Tag>
			{#if returnMeta?.value}
				<span class="player-return">
					→ <Address address={returnMeta.value} />
				</span>
			{/if}
		</div>
	{:else if meta.entries.find((x) => SPECIAL_META.includes(x.name.toLowerCase()))}
		{#each meta.entries.filter( (x) => SPECIAL_META.includes(x.name.toLowerCase()) ) as entry (entry.name + ':' + entry.value)}
			{@const name = entry.name.toLowerCase()}
			{@const payout = Number(entry.value)}
			{#if name === 'payout' && !isNaN(payout) && payout > 0}
				<span class="comp comp-payout">
					{formatCurrency(payout)} <small>KRO</small>
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
				{#if $settings.parsePurchaseItemQuantity && relatedPrice}
					<div class="each">{formatCurrency(relatedPrice.value)} KRO each</div>
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
		<Placeholder text="[No message]" />
	{/if}
</div>

{#if isRefund && refundRef}
	<RefundTransactionModal bind:open={showRefundModal} {transaction} />
{/if}

<style>
	.metadata span {
		display: block;
		max-width: 100%;
		overflow-x: hidden;
	}

	.metadata :global(.tag) {
		display: inline-flex;
	}

	/* Shop Action Styles */
	.action-container {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
	}

	.action-detail {
		color: var(--text-color-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	/* Player Data Styles */
	.player-container {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
	}

	.player-avatar {
		width: 1.2em;
		height: 1.2em;
		border-radius: 0.15em;
		flex-shrink: 0;
	}

	.player-return {
		color: var(--text-color-2);
		font-size: 0.85em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.refund-container {
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
	}

	.refund-trigger {
		background: none;
		padding: 0;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
	}

	.refund-trigger :global(.tag) {
		transition: filter 0.15s ease;
	}

	.refund-trigger:hover :global(.tag) {
		filter: brightness(1.08);
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
</style>
