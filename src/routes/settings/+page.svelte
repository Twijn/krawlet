<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import settings from '$lib/stores/settings';
	import {
		faCog,
		faGlobe,
		faAddressCard,
		faList,
		faTags,
		faClock,
		faServer,
		faWallet
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import { SYNC_NODE_OFFICIAL, SYNC_NODES } from '$lib/consts';
	import { notifications } from '$lib/stores/notifications';
	import { t, t$, locale, LOCALES, type LocaleCode } from '$lib/i18n';
	import NotificationSettings from '$lib/components/widgets/notifications/NotificationSettings.svelte';

	let allowSyncNodeChange = $state($settings.syncNode !== SYNC_NODE_OFFICIAL.id);

	// Language options for the selector
	const languageOptions = Object.entries(LOCALES).map(([code, info]) => ({
		id: code,
		name: `${info.nativeName} (${info.name})`
	}));

	function onLanguageChange() {
		locale.set($settings.language as LocaleCode);
		notifications.success(t('notifications.success'));
	}

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

	function onRelativeTimeChange() {
		if (!$settings.relativeTimeEnabled) {
			$settings.relativeTimeAbove7d = false;
		}
	}

	function onSyncNodeAllowChange() {
		if (!allowSyncNodeChange) {
			$settings.syncNode = SYNC_NODE_OFFICIAL.id;
			onSyncNodeChange();
		}
	}

	let currentSyncNode = $settings.syncNode;
	let notificationId: null | string = null;
	function onSyncNodeChange() {
		notifications.success(t('notifications.syncNodeChanged'));
		if (currentSyncNode !== $settings.syncNode) {
			if (!notificationId) {
				notificationId = notifications.error(t('notifications.refreshRequired'), null, true);
			}
		} else if (notificationId) {
			notifications.remove(notificationId);
			notificationId = null;
		}
	}

	function onShowAllWalletsOptionChange() {
		if (!$settings.showAllWalletsOption) {
			$settings.showAllWalletsDefault = false;
		}
	}
</script>

<svelte:head>
	<title>{$t$('settings.title')} | Krawlet</title>
</svelte:head>

<h1><a href="/">Krawlet</a> <span>&raquo;</span> <a href="/settings">{$t$('settings.title')}</a></h1>

<Section lgCols={12} mdCols={12} smCols={12}>
	<h2><FontAwesomeIcon icon={faCog} /> {$t$('settings.title')}</h2>

	<div class="settings-grid">
		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faGlobe} /> {$t$('settings.language')}</legend>
			<div class="setting-content">
				<label for="language-select" class="setting-description">{$t$('settings.selectLanguage')}</label>
				<ButtonSelect
					vertical={false}
					bind:selected={$settings.language}
					options={languageOptions}
					change={onLanguageChange}
				/>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faAddressCard} /> {$t$('settings.addressDisplay')}</legend>
			<div class="setting-content">
				<ToggleCheckbox bind:checked={$settings.replaceAddressesWithPlayer}>
					{$t$('settings.replaceWithPlayer')}
				</ToggleCheckbox>
				<ToggleCheckbox bind:checked={$settings.replaceAddressesWithKnown}>
					{$t$('settings.replaceWithKnown')}
				</ToggleCheckbox>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faList} /> {$t$('settings.transactionList')}</legend>
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
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faTags} /> {$t$('settings.nameList')}</legend>
			<div class="setting-content">
				<ToggleCheckbox bind:checked={$settings.showOriginalOwner}>
					{$t$('settings.showOriginalOwner')}
				</ToggleCheckbox>
				<ToggleCheckbox bind:checked={$settings.showTransferredDate}>
					{$t$('settings.showTransferredDate')}
				</ToggleCheckbox>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faClock} /> {$t$('settings.dateTime')}</legend>
			<div class="setting-content">
				<ToggleCheckbox bind:checked={$settings.relativeTimeEnabled} onChange={onRelativeTimeChange}>
					{$t$('settings.relativeTime')}
				</ToggleCheckbox>
				<ToggleCheckbox
					bind:checked={$settings.relativeTimeAbove7d}
					disabled={!$settings.relativeTimeEnabled}
				>
					{$t$('settings.relativeTimeAbove7d')}
				</ToggleCheckbox>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faServer} /> {$t$('settings.syncNode')}</legend>
			<div class="setting-content">
				<ToggleCheckbox bind:checked={allowSyncNodeChange} onChange={onSyncNodeAllowChange}>
					{$t$('settings.changeSyncNode')}
				</ToggleCheckbox>
				{#if allowSyncNodeChange}
					<ButtonSelect
						vertical
						bind:selected={$settings.syncNode}
						options={SYNC_NODES.map((node) => ({ id: node.id, name: `${node.name} (${node.url})` }))}
						change={onSyncNodeChange}
					/>
				{/if}
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faWallet} /> {$t$('settings.walletDisplay')}</legend>
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
		</fieldset>
	</div>
</Section>

<NotificationSettings lgCols={12} mdCols={12} smCols={12} />

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

	.setting-description {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.settings-group {
			padding: 0.75rem;
		}
	}
</style>
