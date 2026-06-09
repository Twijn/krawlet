<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import SettingsFieldset from '$lib/components/ui/SettingsFieldset.svelte';
	import settings from '$lib/stores/settings';
	import {
		faDesktop,
		faAddressCard,
		faList,
		faTags,
		faEye,
		faMinus
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import { t$ } from '$lib/i18n';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import Placeholder from '$lib/components/ui/Placeholder.svelte';
	import AdvancedTransactions from '$lib/components/widgets/transactions/AdvancedTransactions.svelte';
	import AdvancedNames from '$lib/components/widgets/names/AdvancedNames.svelte';

	// Example address for previews - uses Twijn's address to demonstrate player name feature
	const EXAMPLE_ADDRESS = 'ks0d5iqb6p';
	const EXAMPLE_SHOP_ADDRESSES = ['kfemcorpfw', 'kfemcorpbt', 'kcomputers', 'klibrarycc'];
	const KRAWLET_ADDRESS = 'kkrawletii';

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
</script>

<Section lgCols={12} mdCols={12} smCols={12}>
	<h2><FontAwesomeIcon icon={faDesktop} /> {$t$('settings.tabs.display')}</h2>

	<div class="settings-grid">
		<SettingsFieldset>
			{#snippet legend()}
				<FontAwesomeIcon icon={faAddressCard} /> {$t$('settings.addressDisplay')}
			{/snippet}
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
						<Address address={EXAMPLE_SHOP_ADDRESSES[1]} showCopy={false} />
						<Address address={KRAWLET_ADDRESS} showCopy={false} />
					</div>
				</div>
			</div>
		</SettingsFieldset>

		<SettingsFieldset>
			{#snippet legend()}
				<FontAwesomeIcon icon={faList} /> {$t$('settings.transactionList')}
			{/snippet}
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
						<AdvancedTransactions limit={5} addresses={EXAMPLE_SHOP_ADDRESSES} storePrefix="tx" />
					</div>
				</div>
			</div>
		</SettingsFieldset>

		<SettingsFieldset>
			{#snippet legend()}<FontAwesomeIcon icon={faTags} /> {$t$('settings.nameList')}{/snippet}
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
						<AdvancedNames limit={5} storePrefix="nm" />
					</div>
				</div>
			</div>
		</SettingsFieldset>

		<SettingsFieldset>
			{#snippet legend()}<FontAwesomeIcon icon={faMinus} /> {$t$('settings.missingData')}{/snippet}
			<div class="settings-columns">
				<div class="setting-content">
					<ToggleCheckbox bind:checked={$settings.simplePlaceholders}>
						{$t$('settings.simplePlaceholders')}
					</ToggleCheckbox>
					<small>{$t$('settings.simplePlaceholdersHint')}</small>
				</div>
				<div class="setting-preview">
					<div class="preview-label"><FontAwesomeIcon icon={faEye} /> Preview</div>
					<div class="preview-content placeholder-preview">
						<Placeholder text="[No message]" />
					</div>
				</div>
			</div>
		</SettingsFieldset>
	</div>
</Section>

<style>
	.settings-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	.placeholder-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		font-size: 0.9rem;
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
</style>
