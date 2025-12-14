<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import settings from '$lib/stores/settings';
	import { faCog } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import { SYNC_NODE_OFFICIAL, SYNC_NODES } from '$lib/consts';
	import { notifications } from '$lib/stores/notifications';
	import { t, t$, locale, LOCALES, type LocaleCode } from '$lib/i18n';

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
	<fieldset>
		<legend>{$t$('settings.language')}</legend>
		<label for="language-select">{$t$('settings.selectLanguage')}</label>
		<ButtonSelect
			vertical={false}
			bind:selected={$settings.language}
			options={languageOptions}
			change={onLanguageChange}
		/>
	</fieldset>
	<fieldset>
		<legend>{$t$('settings.addressDisplay')}</legend>
		<ToggleCheckbox bind:checked={$settings.replaceAddressesWithPlayer}>
			{$t$('settings.replaceWithPlayer')}
		</ToggleCheckbox>
		<ToggleCheckbox bind:checked={$settings.replaceAddressesWithKnown}>
			{$t$('settings.replaceWithKnown')}
		</ToggleCheckbox>
	</fieldset>
	<fieldset>
		<legend>{$t$('settings.transactionList')}</legend>
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
			<small>{$t$('settings.quantityNote')}</small>
		</ToggleCheckbox>
	</fieldset>
	<fieldset>
		<legend>{$t$('settings.nameList')}</legend>
		<ToggleCheckbox bind:checked={$settings.showOriginalOwner}>
			{$t$('settings.showOriginalOwner')}
		</ToggleCheckbox>
		<ToggleCheckbox bind:checked={$settings.showTransferredDate}>
			{$t$('settings.showTransferredDate')}
		</ToggleCheckbox>
	</fieldset>
	<fieldset>
		<legend>{$t$('settings.dateTime')}</legend>
		<ToggleCheckbox bind:checked={$settings.relativeTimeEnabled} onChange={onRelativeTimeChange}>
			{$t$('settings.relativeTime')}
		</ToggleCheckbox>
		<ToggleCheckbox
			bind:checked={$settings.relativeTimeAbove7d}
			disabled={!$settings.relativeTimeEnabled}
		>
			{$t$('settings.relativeTimeAbove7d')}
		</ToggleCheckbox>
	</fieldset>
	<fieldset>
		<legend>{$t$('settings.syncNode')}</legend>
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
	</fieldset>
</Section>
