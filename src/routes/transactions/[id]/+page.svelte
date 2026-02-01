<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faDatabase,
		faInfoCircle,
		faRepeat,
		faRotateLeft,
		faShop,
		faUser,
		faEnvelope,
		faExclamationTriangle,
		faTrash,
		faBoxOpen,
		faExternalLinkAlt,
		faMapMarkerAlt
	} from '@fortawesome/free-solid-svg-icons';
	import { relativeTime, formatCurrency } from '$lib/util';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import kromer from '$lib/api/kromer.js';
	import type { Transaction, TransactionMetadataEntry } from 'kromer';
	import Button from '$lib/components/ui/Button.svelte';
	import Placeholder from '$lib/components/ui/Placeholder.svelte';
	import { t$ } from '$lib/i18n';
	import shopsync, { getItemImageUrl, getRelativeItemUrl } from '$lib/stores/shopsync';
	import type { Listing, Shop } from '$lib/types/shops';

	// Shop modal state
	let showShopModal = $state(false);

	const { data } = $props();

	// Make transaction reactive so it updates when navigating between transactions
	const transaction = $derived(data.transaction as Transaction);

	const transactionMetadata = $derived(kromer.transactions.parseMetadata(transaction));

	// Check if this is a refund transaction
	function findMeta(name: string): TransactionMetadataEntry | undefined {
		return transactionMetadata.entries.find((entry) => entry.name.toLowerCase() === name);
	}

	const refundType = $derived(findMeta('type'));
	const isRefund = $derived(refundType?.value?.toLowerCase() === 'refund');
	const refundRef = $derived(findMeta('ref'));
	const refundOriginal = $derived(findMeta('original'));

	// Check for shop actions
	const shopNameMeta = $derived(findMeta('shop_name'));
	const shopDescriptionMeta = $derived(findMeta('shop_description'));
	const shopDeleteMeta = $derived(
		transactionMetadata.entries.find((e) => e.name.toLowerCase() === 'shop_delete' && !e.value)
	);
	const isShopAction = $derived(shopNameMeta || shopDescriptionMeta || shopDeleteMeta);
	const isSetShopInfo = $derived(shopNameMeta || shopDescriptionMeta);
	const isDeleteShopInfo = $derived(shopDeleteMeta && !isSetShopInfo);

	// Check for player data
	const userUuidMeta = $derived(findMeta('useruuid'));
	const usernameMeta = $derived(findMeta('username'));
	const returnMeta = $derived(findMeta('return'));
	const hasPlayerData = $derived(userUuidMeta || usernameMeta);

	// Check for message/error
	const messageMeta = $derived(findMeta('message') ?? findMeta('msg'));
	const errorMeta = $derived(findMeta('error'));
	const successMeta = $derived(findMeta('success'));

	// Check for item purchase
	const valueOnlyMeta = $derived(
		transactionMetadata.entries.filter((e) => !e.value).map((e) => e.name.toLowerCase())
	);

	// Find related listing for item purchases
	const relatedListing = $derived.by(() => {
		if (valueOnlyMeta.length === 0) return null;

		const shops = $shopsync.data.filter((s) => s.addresses?.includes(transaction.to));
		const listings = shops.reduce(
			(acc, s) => {
				if (s.items) {
					const matchingItems = s.items.filter((i) =>
						i.prices?.find(
							(p) =>
								p.currency.toLowerCase() === 'kro' &&
								valueOnlyMeta.includes(p.requiredMeta?.toLowerCase() ?? '')
						)
					);
					// Attach shop info to listing
					matchingItems.forEach((item) => {
						acc.push({ listing: item, shop: s });
					});
				}
				return acc;
			},
			[] as { listing: Listing; shop: Shop }[]
		);

		return listings.length > 0 ? listings[0] : null;
	});

	// Calculate quantity based on transaction value and unit price
	const purchaseQuantity = $derived.by(() => {
		if (!relatedListing) return 0;
		const price = relatedListing.listing.prices?.find(
			(p) => p.currency.toLowerCase() === 'kro'
		)?.value;
		if (!price || price <= 0) return 0;
		return Math.floor(transaction.value / price);
	});

	// Get unit price
	const unitPrice = $derived(
		relatedListing?.listing.prices?.find((p) => p.currency.toLowerCase() === 'kro')?.value ?? 0
	);

	// Internal meta fields to filter out of "Other" display
	const INTERNAL_META = [
		'type',
		'ref',
		'original',
		'shop_name',
		'shop_description',
		'shop_delete',
		'useruuid',
		'username',
		'return',
		'message',
		'msg',
		'error',
		'success'
	];

	// Get remaining metadata entries (exclude purchase meta if we found a listing)
	const otherMetaEntries = $derived(
		transactionMetadata.entries.filter((e) => {
			// Filter out internal meta
			if (INTERNAL_META.includes(e.name.toLowerCase())) return false;
			// If we have a related listing, also filter out the purchase meta (value-only entries)
			if (relatedListing && !e.value) return false;
			return true;
		})
	);

	// Fetch referenced transaction if this is a refund
	$effect(() => {
		if (isRefund && refundRef?.value) {
			kromer.transactions
				.get(Number(refundRef.value))
				.then((tx) => {
					console.log('Referenced transaction:', tx);
				})
				.catch((e) => {
					console.error('Failed to fetch referenced transaction:', e);
				});
		}
	});
</script>

<svelte:head>
	<title>Transaction #{transaction.id} | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span> <a href="/transactions">Transactions</a>
	<span>&raquo;</span>
	<a href="/transactions/{transaction.id}">#{transaction.id}</a>
</h1>

<div class="col-12 statistics">
	<div class="statistic">
		<div>
			<Button
				variant="primary"
				href="/transactions/new?to={transaction.to}&amount={transaction.value}&metadata={transaction.metadata}"
			>
				<FontAwesomeIcon icon={faRepeat} />
				Repeat
			</Button>
		</div>
	</div>
	<div class="statistic">
		<h2>ID</h2>
		<div>{transaction.id.toLocaleString()}</div>
	</div>
	{#if transaction.from}
		<div class="statistic">
			<h2>From</h2>
			<div><Address address={transaction.from} /></div>
		</div>
	{/if}
	<div class="statistic">
		<h2>To</h2>
		<div><Address address={transaction.to} /></div>
	</div>
	<div class="statistic">
		<h2>Amount</h2>
		<div>{formatCurrency(transaction.value)} <small>KRO</small></div>
	</div>
	<div class="statistic">
		<h2>Time</h2>
		<div title={new Date(transaction.time).toLocaleString()}>
			{relativeTime(transaction.time)}
		</div>
	</div>
</div>

{#if isRefund && refundRef?.value}
	<div class="col-12 refund-note">
		<FontAwesomeIcon icon={faRotateLeft} />
		{$t$('refund.reference')} <a href="/transactions/{refundRef.value}">#{refundRef.value}</a>
		{#if refundOriginal}
			{@const percentage = (transaction.value / Number(refundOriginal.value)) * 100}
			<span class="refund-stats">
				({formatCurrency(transaction.value)} of {formatCurrency(Number(refundOriginal.value))} KRO, {percentage.toFixed(
					0
				)}%)
			</span>
		{/if}
	</div>
{/if}

<Section lgCols={4} mdCols={12}>
	<h2><FontAwesomeIcon icon={faInfoCircle} /> Raw Information</h2>
	<div class="table-container">
		<table>
			<tbody>
				<tr>
					<th>Type</th>
					<td class="capitalize right">
						{transaction.type}
					</td>
				</tr>
				<tr>
					<th>From</th>
					<td class="right">
						{#if transaction.from}
							<Address address={transaction.from} />
						{:else}
							<small>Unknown Sender</small>
						{/if}
					</td>
				</tr>
				<tr>
					<th>To</th>
					<td class="right">
						<Address address={transaction.to} />
					</td>
				</tr>
				{#if transaction.sent_name}
					<tr>
						<th>Sent to Name</th>
						<td class="right">
							<code
								>{transaction.sent_metaname
									? `${transaction.sent_metaname}@`
									: ''}{transaction.sent_name}<small>.kro</small></code
							>
						</td>
					</tr>
				{/if}
				<tr>
					<th>Amount</th>
					<td class="right">
						{transaction.value.toFixed(2)} <small>KRO</small>
					</td>
				</tr>
				<tr>
					<th>Time</th>
					<td class="right">
						{transaction.time.toLocaleString()}
					</td>
				</tr>
				<tr>
					<th>Relative Time</th>
					<td class="right">
						{relativeTime(transaction.time)}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</Section>

<Section lgCols={8} mdCols={12}>
	<h2><FontAwesomeIcon icon={faDatabase} /> Metadata</h2>
	{#if transaction.metadata && transaction.metadata.length > 0}
		<!-- Shop Action Section -->
		{#if isShopAction}
			<div class="meta-section meta-shop" class:meta-delete={isDeleteShopInfo}>
				<h3>
					<FontAwesomeIcon icon={isDeleteShopInfo ? faTrash : faShop} />
					{isDeleteShopInfo ? $t$('parsedMeta.deleteShopInfo') : $t$('parsedMeta.setShopInfo')}
				</h3>
				{#if isDeleteShopInfo}
					<p class="meta-warning">
						This transaction requested deletion of shop info for this address.
					</p>
				{:else}
					<div class="meta-details">
						{#if shopNameMeta?.value}
							<div class="meta-row">
								<span class="meta-label">{$t$('parsedMeta.shopName')}:</span>
								<span class="meta-value">{shopNameMeta.value}</span>
							</div>
						{/if}
						{#if shopDescriptionMeta?.value}
							<div class="meta-row">
								<span class="meta-label">{$t$('parsedMeta.shopDescription')}:</span>
								<span class="meta-value">{shopDescriptionMeta.value}</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Player Data Section -->
		{#if hasPlayerData}
			<div class="meta-section meta-player">
				<h3>
					<FontAwesomeIcon icon={faUser} />
					{$t$('parsedMeta.playerData')}
				</h3>
				<div class="meta-details player-card">
					{#if userUuidMeta?.value}
						<img
							class="player-avatar-large"
							src="https://api.mineatar.io/face/{userUuidMeta.value}"
							alt="Player avatar"
						/>
					{/if}
					<div class="player-info">
						{#if usernameMeta?.value}
							<div class="meta-row">
								<span class="meta-label">{$t$('parsedMeta.username')}:</span>
								<span class="meta-value player-name">{usernameMeta.value}</span>
							</div>
						{/if}
						{#if userUuidMeta?.value}
							<div class="meta-row">
								<span class="meta-label">UUID:</span>
								<span class="meta-value uuid">{userUuidMeta.value}</span>
							</div>
						{/if}
						{#if returnMeta?.value}
							<div class="meta-row">
								<span class="meta-label">{$t$('parsedMeta.returnAddress')}:</span>
								<span class="meta-value"><Address address={returnMeta.value} /></span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Message Section -->
		{#if messageMeta?.value}
			<div class="meta-section meta-message">
				<h3>
					<FontAwesomeIcon icon={faEnvelope} />
					{$t$('parsedMeta.message')}
				</h3>
				<p class="message-content">{messageMeta.value}</p>
			</div>
		{/if}

		<!-- Error Section -->
		{#if errorMeta?.value}
			<div class="meta-section meta-error">
				<h3>
					<FontAwesomeIcon icon={faExclamationTriangle} />
					{$t$('parsedMeta.error')}
				</h3>
				<p class="error-content">{errorMeta.value}</p>
			</div>
		{/if}

		<!-- Success Section -->
		{#if successMeta?.value}
			<div class="meta-section meta-success">
				<h3>
					<FontAwesomeIcon icon={faInfoCircle} />
					Success
				</h3>
				<p class="success-content">{successMeta.value}</p>
			</div>
		{/if}

		<!-- Item Purchase Section -->
		{#if relatedListing}
			{@const listing = relatedListing.listing}
			{@const shop = relatedListing.shop}
			<div class="meta-section meta-purchase">
				<h3>
					<FontAwesomeIcon icon={faBoxOpen} />
					{$t$('parsedMeta.itemPurchase')}
				</h3>
				<div class="purchase-card">
					<a class="item-image-link" href={getRelativeItemUrl(listing)}>
						<img
							class="item-image"
							src={getItemImageUrl(listing)}
							alt="Item icon for {listing.itemDisplayName}"
						/>
					</a>
					<div class="purchase-info">
						<a class="item-name" href={getRelativeItemUrl(listing)}>
							{listing.itemDisplayName ?? listing.itemName}
							{#if purchaseQuantity > 0}
								<span class="item-quantity">×{purchaseQuantity.toLocaleString()}</span>
							{/if}
						</a>
						<div class="purchase-price">
							<span class="price-total">{formatCurrency(transaction.value)} KRO</span>
							{#if purchaseQuantity > 1}
								<span class="price-each">({formatCurrency(unitPrice)} each)</span>
							{/if}
						</div>
						{#if shop}
							<button class="shop-link" onclick={() => (showShopModal = true)}>
								<FontAwesomeIcon icon={faShop} />
								{shop.name || 'View Shop'}
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Shop Info Modal -->
			{#if shop}
				<Modal
					open={showShopModal}
					title={shop.name || 'Shop Details'}
					onClose={() => (showShopModal = false)}
					maxWidth="500px"
				>
					<div class="shop-modal-content">
						{#if shop.description}
							<p class="shop-description">{shop.description}</p>
						{/if}

						<div class="shop-modal-details">
							{#if shop.owner}
								<div class="shop-detail-card">
									<div class="shop-detail-icon">
										<FontAwesomeIcon icon={faUser} />
									</div>
									<div class="shop-detail-content">
										<span class="shop-detail-label">Owner</span>
										<span class="shop-detail-value">{shop.owner}</span>
									</div>
								</div>
							{/if}
							{#if shop.locationDescription || shop.locationCoordinates}
								<div class="shop-detail-card">
									<div class="shop-detail-icon">
										<FontAwesomeIcon icon={faMapMarkerAlt} />
									</div>
									<div class="shop-detail-content">
										<span class="shop-detail-label">Location</span>
										<span class="shop-detail-value">
											{#if shop.locationDescription}
												{shop.locationDescription}
											{/if}
										</span>
										{#if shop.locationCoordinates}
											<code class="coords">{shop.locationCoordinates}</code>
										{/if}
									</div>
								</div>
							{/if}
							{#if shop.softwareName}
								<div class="shop-detail-card">
									<div class="shop-detail-icon">
										<FontAwesomeIcon icon={faInfoCircle} />
									</div>
									<div class="shop-detail-content">
										<span class="shop-detail-label">Software</span>
										<span class="shop-detail-value">
											{shop.softwareName}
											{#if shop.softwareVersion}
												<span class="version">v{shop.softwareVersion}</span>
											{/if}
										</span>
									</div>
								</div>
							{/if}
						</div>

						<div class="shop-modal-actions">
							<Button variant="primary" href="/shops/{shop.id}">
								<FontAwesomeIcon icon={faExternalLinkAlt} />
								View Full Shop
							</Button>
						</div>
					</div>
				</Modal>
			{/if}
		{/if}

		<!-- Other Metadata -->
		{#if otherMetaEntries.length > 0}
			<div class="meta-section meta-other">
				<h3>Other Metadata</h3>
				<div class="table-container">
					<table>
						<thead>
							<tr>
								<th>Name</th>
								<th>Value</th>
							</tr>
						</thead>
						<tbody>
							{#each otherMetaEntries as metadata (metadata.name)}
								<tr>
									{#if metadata?.value}
										<th class="caps">{metadata.name}</th>
										<td>
											{#if metadata.name === 'return' && metadata.value.length === 10}
												<a href="/addresses/{metadata.value}">
													{metadata.value}
												</a>
											{:else}
												{metadata.value}
											{/if}
										</td>
									{:else}
										<th><small><Placeholder text="[no name]" /></small></th>
										<td>{metadata.name}</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- Raw Metadata (collapsible) -->
		<details class="raw-meta">
			<summary>View Raw Metadata</summary>
			<code class="block">{transaction.metadata}</code>
		</details>
	{:else}
		<small>There is no metadata on this transaction!</small>
	{/if}
</Section>

<style>
	code.block {
		display: block;
		font-family: monospace;
		background-color: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.6rem 0.8rem;
		margin: 0.5rem 0;
		border-radius: 0.25rem;
		word-break: break-all;
	}

	.capitalize {
		text-transform: capitalize;
	}

	/* Refund note styles */
	.refund-note {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		background-color: rgba(var(--yellow), 0.1);
		border-radius: 0.5rem;
		color: rgb(var(--yellow));
		font-size: 0.9rem;
	}

	.refund-note a {
		color: rgb(var(--yellow));
		font-weight: 600;
		text-decoration: underline;
		cursor: pointer;
	}

	.refund-note a:hover {
		text-decoration: none;
	}

	.refund-stats {
		color: var(--text-color-2);
		font-size: 0.85em;
	}

	/* Meta section styles */
	.meta-section {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.meta-section h3 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.75rem 0;
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.meta-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.meta-row {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.meta-label {
		font-weight: 500;
		color: var(--text-color-2);
		flex-shrink: 0;
	}

	.meta-value {
		word-break: break-word;
	}

	/* Shop action styles */
	.meta-shop {
		background-color: rgba(var(--blue), 0.08);
		border: 1px solid rgba(var(--blue), 0.2);
	}

	.meta-shop h3 {
		color: rgb(var(--blue));
	}

	.meta-shop.meta-delete {
		background-color: rgba(var(--red), 0.08);
		border: 1px solid rgba(var(--red), 0.2);
	}

	.meta-shop.meta-delete h3 {
		color: rgb(var(--red));
	}

	.meta-warning {
		color: rgb(var(--red));
		margin: 0;
		font-size: 0.9rem;
	}

	/* Player data styles */
	.meta-player {
		background-color: rgba(var(--green), 0.08);
		border: 1px solid rgba(var(--green), 0.2);
	}

	.meta-player h3 {
		color: rgb(var(--green));
	}

	.player-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.player-avatar-large {
		width: 48px;
		height: 48px;
		border-radius: 0.25rem;
		flex-shrink: 0;
	}

	.player-info {
		flex: 1;
		min-width: 0;
	}

	.player-name {
		font-weight: 600;
	}

	.uuid {
		font-family: monospace;
		font-size: 0.85em;
		color: var(--text-color-2);
	}

	/* Message styles */
	.meta-message {
		background-color: rgba(var(--blue), 0.08);
		border: 1px solid rgba(var(--blue), 0.2);
	}

	.meta-message h3 {
		color: rgb(var(--blue));
	}

	.message-content {
		margin: 0;
		font-size: 0.95rem;
	}

	/* Error styles */
	.meta-error {
		background-color: rgba(var(--red), 0.08);
		border: 1px solid rgba(var(--red), 0.2);
	}

	.meta-error h3 {
		color: rgb(var(--red));
	}

	.error-content {
		margin: 0;
		font-size: 0.95rem;
		color: rgb(var(--red));
	}

	/* Success styles */
	.meta-success {
		background-color: rgba(var(--green), 0.08);
		border: 1px solid rgba(var(--green), 0.2);
	}

	.meta-success h3 {
		color: rgb(var(--green));
	}

	.success-content {
		margin: 0;
		font-size: 0.95rem;
		color: rgb(var(--green));
	}

	/* Other metadata styles */
	.meta-other {
		background-color: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.meta-other h3 {
		color: var(--text-color-2);
	}

	/* Raw metadata toggle */
	.raw-meta {
		margin-top: 1rem;
	}

	.raw-meta summary {
		cursor: pointer;
		color: var(--text-color-2);
		font-size: 0.85rem;
		user-select: none;
	}

	.raw-meta summary:hover {
		color: var(--text-color-1);
	}

	.raw-meta[open] summary {
		margin-bottom: 0.5rem;
	}

	/* Item Purchase styles */
	.meta-purchase {
		background-color: rgba(var(--purple), 0.08);
		border: 1px solid rgba(var(--purple), 0.2);
	}

	.meta-purchase h3 {
		color: rgb(var(--purple));
	}

	.purchase-card {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.item-image-link {
		flex-shrink: 0;
	}

	.item-image {
		width: 48px;
		height: 48px;
		object-fit: contain;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.375rem;
		padding: 0.375rem;
	}

	.purchase-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.item-name {
		font-weight: 600;
		font-size: 1rem;
		color: var(--text-color-1);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.item-name:hover {
		text-decoration: underline;
	}

	.item-quantity {
		font-size: 0.85em;
		color: rgb(var(--purple));
		font-weight: 500;
	}

	.purchase-price {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}

	.price-total {
		font-weight: 600;
		color: var(--text-color-1);
	}

	.price-each {
		font-size: 0.85em;
		color: var(--text-color-2);
	}

	.shop-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.5rem;
		margin-top: 0.25rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.25rem;
		color: var(--text-color-2);
		font-size: 0.85rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s ease;
		width: fit-content;
	}

	.shop-link:hover {
		background: rgba(255, 255, 255, 0.12);
		color: var(--text-color-1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	/* Shop Modal Styles */
	.shop-modal-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.shop-description {
		margin: 0;
		color: var(--text-color-2);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.shop-modal-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.shop-detail-card {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.shop-detail-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		background: rgba(var(--blue), 0.15);
		border-radius: 0.375rem;
		color: rgb(var(--blue));
		flex-shrink: 0;
	}

	.shop-detail-content {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
		flex: 1;
	}

	.shop-detail-label {
		font-size: 0.7rem;
		color: var(--text-color-2);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.shop-detail-value {
		color: var(--text-color-1);
		font-size: 0.95rem;
	}

	.shop-detail-value .version {
		color: var(--text-color-2);
		font-size: 0.85em;
		margin-left: 0.25rem;
	}

	.shop-detail-content .coords {
		display: inline-block;
		margin-top: 0.35rem;
		padding: 0.25rem 0.5rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.25rem;
		font-size: 0.85em;
		color: var(--text-color-2);
		font-family: monospace;
	}

	.shop-modal-actions {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}
</style>
