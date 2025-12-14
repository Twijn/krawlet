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
				<div class="toggle-row">
					<ToggleCheckbox bind:checked={$settings.replaceAddressesWithPlayer}>
						{$t$('settings.replaceWithPlayer')}
					</ToggleCheckbox>
				</div>
				<div class="toggle-row">
					<ToggleCheckbox bind:checked={$settings.replaceAddressesWithKnown}>
						{$t$('settings.replaceWithKnown')}
					</ToggleCheckbox>
				</div>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faList} /> {$t$('settings.transactionList')}</legend>
			<div class="setting-content">
				<div class="toggle-row">
					<ToggleCheckbox bind:checked={$settings.showMetadata} onChange={onShowMetadataChange}>
						{$t$('settings.showMetadata')}
					</ToggleCheckbox>
				</div>
				<div class="toggle-row nested">
					<ToggleCheckbox
						bind:checked={$settings.parseTransactionMessage}
						disabled={!$settings.showMetadata}
						onChange={onParseTransactionMessageChange}
					>
						{$t$('settings.parseMessage')}
					</ToggleCheckbox>
				</div>
				<div class="toggle-row nested-2">
					<ToggleCheckbox
						bind:checked={$settings.parsePurchaseItem}
						disabled={!$settings.parseTransactionMessage}
						onChange={onParsePurchaseItemChange}
					>
						{$t$('settings.parseItem')}
					</ToggleCheckbox>
				</div>
				<div class="toggle-row nested-3">
					<ToggleCheckbox
						bind:checked={$settings.parsePurchaseItemQuantity}
						disabled={!$settings.parsePurchaseItem}
					>
						{$t$('settings.parseQuantity')}
					</ToggleCheckbox>
					<small class="setting-note">{$t$('settings.quantityNote')}</small>
				</div>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faTags} /> {$t$('settings.nameList')}</legend>
			<div class="setting-content">
				<div class="toggle-row">
					<ToggleCheckbox bind:checked={$settings.showOriginalOwner}>
						{$t$('settings.showOriginalOwner')}
					</ToggleCheckbox>
				</div>
				<div class="toggle-row">
					<ToggleCheckbox bind:checked={$settings.showTransferredDate}>
						{$t$('settings.showTransferredDate')}
					</ToggleCheckbox>
				</div>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faClock} /> {$t$('settings.dateTime')}</legend>
			<div class="setting-content">
				<div class="toggle-row">
					<ToggleCheckbox bind:checked={$settings.relativeTimeEnabled} onChange={onRelativeTimeChange}>
						{$t$('settings.relativeTime')}
					</ToggleCheckbox>
				</div>
				<div class="toggle-row nested">
					<ToggleCheckbox
						bind:checked={$settings.relativeTimeAbove7d}
						disabled={!$settings.relativeTimeEnabled}
					>
						{$t$('settings.relativeTimeAbove7d')}
					</ToggleCheckbox>
				</div>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faServer} /> {$t$('settings.syncNode')}</legend>
			<div class="setting-content">
				<div class="toggle-row">
					<ToggleCheckbox bind:checked={allowSyncNodeChange} onChange={onSyncNodeAllowChange}>
						{$t$('settings.changeSyncNode')}
					</ToggleCheckbox>
				</div>
				{#if allowSyncNodeChange}
					<div class="sync-node-selector">
						<ButtonSelect
							vertical
							bind:selected={$settings.syncNode}
							options={SYNC_NODES.map((node) => ({ id: node.id, name: `${node.name} (${node.url})` }))}
							change={onSyncNodeChange}
						/>
					</div>
				{/if}
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faWallet} /> {$t$('settings.walletDisplay')}</legend>
			<div class="setting-content">
				<div class="toggle-row">
					<ToggleCheckbox
						bind:checked={$settings.showAllWalletsOption}
						onChange={onShowAllWalletsOptionChange}
					>
						{$t$('settings.showAllWalletsOption')}
					</ToggleCheckbox>
				</div>
				<div class="toggle-row nested">
					<ToggleCheckbox
						bind:checked={$settings.showAllWalletsDefault}
						disabled={!$settings.showAllWalletsOption}
					>
						{$t$('settings.showAllWalletsDefault')}
					</ToggleCheckbox>
				</div>
			</div>
		</fieldset>
	</div>
</Section>

<NotificationSettings lgCols={12} mdCols={12} smCols={12} />

<style>
	.settings-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.settings-group {
		background-color: rgba(0, 0, 0, 0.15);
		border-radius: 0.5rem;
		padding: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.05);
		transition: border-color 0.2s ease;
	}

	.settings-group:hover {
		border-color: rgba(255, 255, 255, 0.1);
	}

	.settings-group legend {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--theme-color-2);
		opacity: 1;
		padding: 0 0.5rem;
		text-align: left;
	}

	.settings-group legend :global(svg) {
		width: 1rem;
		height: 1rem;
		opacity: 0.8;
	}

	.setting-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 0.5rem;
	}

	.setting-description {
		font-size: 0.875rem;
		color: var(--text-color-2);
		margin-bottom: 0.5rem;
	}

	.toggle-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.toggle-row.nested {
		margin-left: 1.5rem;
		padding-left: 0.75rem;
		border-left: 2px solid rgba(255, 255, 255, 0.1);
	}

	.toggle-row.nested-2 {
		margin-left: 3rem;
		padding-left: 0.75rem;
		border-left: 2px solid rgba(255, 255, 255, 0.08);
	}

	.toggle-row.nested-3 {
		margin-left: 4.5rem;
		padding-left: 0.75rem;
		border-left: 2px solid rgba(255, 255, 255, 0.06);
	}

	.setting-note {
		font-size: 0.8rem;
		color: var(--text-color-2);
		margin-left: 3.5rem;
		margin-top: 0.25rem;
		line-height: 1.4;
	}

	.sync-node-selector {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 0.375rem;
	}

	@media (max-width: 768px) {
		.settings-group {
			padding: 0.75rem;
		}

		.toggle-row.nested {
			margin-left: 1rem;
		}

		.toggle-row.nested-2 {
			margin-left: 2rem;
		}

		.toggle-row.nested-3 {
			margin-left: 3rem;
		}

		.setting-note {
			margin-left: 3.5rem;
		}
	}
</style>
