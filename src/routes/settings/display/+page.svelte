<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import settings from '$lib/stores/settings';
	import {
		faDesktop,
		faAddressCard,
		faList,
		faTags,
		faWallet,
		faEye
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import { t$ } from '$lib/i18n';
	import { SYNC_NODE_OFFICIAL } from '$lib/consts';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import Transactions from '$lib/components/widgets/transactions/Transactions.svelte';
	import Names from '$lib/components/widgets/names/Names.svelte';
	import WalletCardCompact from '$lib/components/widgets/wallets/WalletCardCompact.svelte';

	// Example address for previews - uses Twijn's address to demonstrate player name feature
	const EXAMPLE_ADDRESS = 'ks0d5iqb6p';
	const EXAMPLE_SHOP_ADDRESS = 'ktwijnmall';
	const KRAWLET_ADDRESS = 'kkrawletii';

	// Example wallet for wallet display preview
	const EXAMPLE_WALLET = {
		name: 'My Wallet',
		address: EXAMPLE_ADDRESS,
		private: '',
		syncNode: SYNC_NODE_OFFICIAL.id
	};

	function onShowMetadataChange() {
		if (!$settings.showMetadata) {
			$settings.parseTransactionMessage = false;
			$settings.parsePurchaseItem = false;
			$settings.parsePurchaseItemQuantity = false;
		}
	}

	function onParseTransactionMessageChange() {
		if (!$settings.parseTransactionMessage) {
			$settings.parsePurchaseItem = false;
			$settings.parsePurchaseItemQuantity = false;
		}
	}

	function onParsePurchaseItemChange() {
		if (!$settings.parsePurchaseItem) {
			$settings.parsePurchaseItemQuantity = false;
		}
	}

	function onShowAllWalletsOptionChange() {
		if (!$settings.showAllWalletsOption) {
			$settings.showAllWalletsDefault = false;
		}
	}
</script>

<Section lgCols={12} mdCols={12} smCols={12}>
	<h2><FontAwesomeIcon icon={faDesktop} /> {$t$('settings.tabs.display')}</h2>

	<div class="settings-grid">
		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faAddressCard} /> {$t$('settings.addressDisplay')}</legend>
			<div class="settings-columns">
				<div class="setting-content">
					<ToggleCheckbox bind:checked={$settings.replaceAddressesWithPlayer}>
						{$t$('settings.replaceWithPlayer')}
					</ToggleCheckbox>
					<ToggleCheckbox bind:checked={$settings.replaceAddressesWithKnown}>
						{$t$('settings.replaceWithKnown')}
					</ToggleCheckbox>
				</div>
				<div class="setting-preview">
					<div class="preview-label"><FontAwesomeIcon icon={faEye} /> Preview</div>
					<div class="preview-content address-preview">
						<Address address={EXAMPLE_ADDRESS} showCopy={false} />
						<Address address={EXAMPLE_SHOP_ADDRESS} showCopy={false} />
						<Address address={KRAWLET_ADDRESS} showCopy={false} />
					</div>
				</div>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faList} /> {$t$('settings.transactionList')}</legend>
			<div class="settings-columns">
				<div class="setting-content">
					<ToggleCheckbox bind:checked={$settings.showMetadata} onChange={onShowMetadataChange}>
						{$t$('settings.showMetadata')}
					</ToggleCheckbox>
					<ToggleCheckbox
						bind:checked={$settings.parseTransactionMessage}
						disabled={!$settings.showMetadata}
						onChange={onParseTransactionMessageChange}
					>
						{$t$('settings.parseMessage')}
					</ToggleCheckbox>
					<ToggleCheckbox
						bind:checked={$settings.parsePurchaseItem}
						disabled={!$settings.parseTransactionMessage}
						onChange={onParsePurchaseItemChange}
					>
						{$t$('settings.parseItem')}
					</ToggleCheckbox>
					<ToggleCheckbox
						bind:checked={$settings.parsePurchaseItemQuantity}
						disabled={!$settings.parsePurchaseItem}
					>
						{$t$('settings.parseQuantity')}
					</ToggleCheckbox>
					<small>{$t$('settings.quantityNote')}</small>
				</div>
				<div class="setting-preview wide-preview">
					<div class="preview-label"><FontAwesomeIcon icon={faEye} /> Preview</div>
					<div class="preview-content component-preview">
						<Transactions address={EXAMPLE_SHOP_ADDRESS} limit={3} queryPrefix="settings_tx_" />
					</div>
				</div>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faTags} /> {$t$('settings.nameList')}</legend>
			<div class="settings-columns">
				<div class="setting-content">
					<ToggleCheckbox bind:checked={$settings.showOriginalOwner}>
						{$t$('settings.showOriginalOwner')}
					</ToggleCheckbox>
					<ToggleCheckbox bind:checked={$settings.showTransferredDate}>
						{$t$('settings.showTransferredDate')}
					</ToggleCheckbox>
				</div>
				<div class="setting-preview wide-preview">
					<div class="preview-label"><FontAwesomeIcon icon={faEye} /> Preview</div>
					<div class="preview-content component-preview">
						<Names limit={3} queryPrefix="settings_names_" />
					</div>
				</div>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faWallet} /> {$t$('settings.walletDisplay')}</legend>
			<div class="settings-columns">
				<div class="setting-content">
					<ToggleCheckbox
						bind:checked={$settings.showAllWalletsOption}
						onChange={onShowAllWalletsOptionChange}
					>
						{$t$('settings.showAllWalletsOption')}
					</ToggleCheckbox>
					<ToggleCheckbox
						bind:checked={$settings.showAllWalletsDefault}
						disabled={!$settings.showAllWalletsOption}
					>
						{$t$('settings.showAllWalletsDefault')}
					</ToggleCheckbox>
				</div>
				<div class="setting-preview">
					<div class="preview-label"><FontAwesomeIcon icon={faEye} /> Preview</div>
					<div class="preview-content wallet-preview">
						<WalletCardCompact wallet={EXAMPLE_WALLET} balance={1234.56} />
						{#if $settings.showAllWalletsOption}
							<small class="wallet-hint">
								{#if $settings.showAllWalletsDefault}
									Wallets from all sync nodes shown by default
								{:else}
									Toggle available to show wallets from other sync nodes
								{/if}
							</small>
						{/if}
					</div>
				</div>
			</div>
		</fieldset>
	</div>
</Section>

<style>
	.settings-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.settings-group {
		margin-bottom: 0;
		padding: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
	}

	.settings-group legend {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		padding: 0 0.5rem;
	}

	.settings-group legend :global(svg) {
		width: 1rem;
		height: 1rem;
		opacity: 0.7;
	}

	.settings-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		align-items: start;
	}

	.setting-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-content small {
		display: block;
		margin-top: 0.25rem;
		opacity: 0.75;
		font-size: 0.875rem;
	}

	.setting-preview {
		background-color: transparent;
		border-radius: 0.5rem;
		padding: 0.75rem;
		border: 1px dashed rgba(255, 255, 255, 0.1);
	}

	.setting-preview.wide-preview {
		grid-column: 1 / -1;
	}

	.preview-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.5);
		margin-bottom: 0.75rem;
	}

	.preview-label :global(svg) {
		width: 0.75rem;
		height: 0.75rem;
	}

	.preview-content {
		font-size: 0.9rem;
	}

	.address-preview {
		display: flex;
		justify-content: center;
		padding: 1rem 0;
	}

	/* Scale down embedded components in preview */
	.component-preview {
		font-size: 0.85rem;
	}

	.component-preview :global(section) {
		padding: 0;
		background: transparent;
		border: none;
	}

	.component-preview :global(h2) {
		display: none;
	}

	.component-preview :global(.table-container) {
		overflow-x: auto;
	}

	.wallet-preview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		font-size: 0.85rem;
	}

	.wallet-preview :global(.wallet-card-compact) {
		padding: 0.5rem 0.75rem;
		gap: 0.5rem;
	}

	.wallet-preview :global(.wallet-icon) {
		font-size: 1rem;
	}

	.wallet-preview :global(.balance-amount) {
		font-size: 0.9rem;
	}

	.wallet-hint {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-align: center;
		font-style: italic;
	}

	@media (max-width: 900px) {
		.settings-columns {
			grid-template-columns: 1fr;
		}

		.setting-preview {
			margin-top: 0.5rem;
		}

		.setting-preview.wide-preview {
			grid-column: auto;
		}
	}

	@media (max-width: 768px) {
		.settings-group {
			padding: 0.75rem;
		}
	}
</style>
