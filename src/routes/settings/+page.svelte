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
		faWallet,
		faEye,
		faKey,
		faSync,
		faCheckCircle,
		faTimesCircle
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { SYNC_NODE_OFFICIAL, SYNC_NODES, SEVEN_DAYS } from '$lib/consts';
	import { notifications } from '$lib/stores/notifications';
	import { t, t$, locale, LOCALES, type LocaleCode } from '$lib/i18n';
	import NotificationSettings from '$lib/components/widgets/notifications/NotificationSettings.svelte';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import Transactions from '$lib/components/widgets/transactions/Transactions.svelte';
	import Names from '$lib/components/widgets/names/Names.svelte';
	import WalletCardCompact from '$lib/components/widgets/wallets/WalletCardCompact.svelte';
	import { relativeTime } from '$lib/util';
	import krawletClient from '$lib/api/krawlet';
	import type { ApiKeyInfo } from 'krawlet-js';

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

	// Preview dates for datetime settings
	const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
	const olderDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

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

	// API Key info state
	let apiKeyInfo: ApiKeyInfo | null = $state(null);
	let apiKeyLoading = $state(false);
	let apiKeyError: string | null = $state(null);

	async function fetchApiKeyInfo() {
		if (!$settings.krawletApiKey) {
			apiKeyInfo = null;
			apiKeyError = null;
			return;
		}

		apiKeyLoading = true;
		apiKeyError = null;

		try {
			apiKeyInfo = await krawletClient.apiKey.getInfo({ usage: true });
		} catch (err: unknown) {
			console.error('Failed to fetch API key info:', err);
			apiKeyInfo = null;
			apiKeyError = err instanceof Error ? err.message : 'Failed to fetch API key info';
		} finally {
			apiKeyLoading = false;
		}
	}

	// Fetch API key info when the key changes
	$effect(() => {
		if ($settings.krawletApiKey) {
			// Small delay to allow the client to update with the new key
			setTimeout(fetchApiKeyInfo, 100);
		} else {
			apiKeyInfo = null;
			apiKeyError = null;
		}
	});
</script>

<svelte:head>
	<title>{$t$('settings.title')} | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span> <a href="/settings">{$t$('settings.title')}</a>
</h1>

<Section lgCols={12} mdCols={12} smCols={12}>
	<h2><FontAwesomeIcon icon={faCog} /> {$t$('settings.title')}</h2>

	<div class="settings-grid">
		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faGlobe} /> {$t$('settings.language')}</legend>
			<div class="settings-columns">
				<div class="setting-content">
					<label for="language-select" class="setting-description"
						>{$t$('settings.selectLanguage')}</label
					>
					<ButtonSelect
						vertical={false}
						bind:selected={$settings.language}
						options={languageOptions}
						change={onLanguageChange}
					/>
				</div>
			</div>
		</fieldset>

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
			<legend><FontAwesomeIcon icon={faClock} /> {$t$('settings.dateTime')}</legend>
			<div class="settings-columns">
				<div class="setting-content">
					<ToggleCheckbox
						bind:checked={$settings.relativeTimeEnabled}
						onChange={onRelativeTimeChange}
					>
						{$t$('settings.relativeTime')}
					</ToggleCheckbox>
					<ToggleCheckbox
						bind:checked={$settings.relativeTimeAbove7d}
						disabled={!$settings.relativeTimeEnabled}
					>
						{$t$('settings.relativeTimeAbove7d')}
					</ToggleCheckbox>
				</div>
				<div class="setting-preview">
					<div class="preview-label"><FontAwesomeIcon icon={faEye} /> Preview</div>
					<div class="preview-content datetime-preview">
						<div class="datetime-example">
							<span class="datetime-label">Recent (2 hours ago):</span>
							<span class="datetime-value">
								{#if $settings.relativeTimeEnabled}
									{relativeTime(recentDate)}
								{:else}
									{recentDate.toLocaleString()}
								{/if}
							</span>
						</div>
						<div class="datetime-example">
							<span class="datetime-label">Older (10 days ago):</span>
							<span class="datetime-value">
								{#if $settings.relativeTimeEnabled && $settings.relativeTimeAbove7d}
									{relativeTime(olderDate)}
								{:else}
									{olderDate.toLocaleString()}
								{/if}
							</span>
						</div>
					</div>
				</div>
			</div>
		</fieldset>

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faServer} /> {$t$('settings.syncNode')}</legend>
			<div class="settings-columns">
				<div class="setting-content">
					<ToggleCheckbox bind:checked={allowSyncNodeChange} onChange={onSyncNodeAllowChange}>
						{$t$('settings.changeSyncNode')}
					</ToggleCheckbox>
					{#if allowSyncNodeChange}
						<ButtonSelect
							vertical
							bind:selected={$settings.syncNode}
							options={SYNC_NODES.map((node) => ({
								id: node.id,
								name: `${node.name} (${node.url})`
							}))}
							change={onSyncNodeChange}
						/>
					{/if}
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

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faKey} /> {$t$('settings.apiKeys')}</legend>
			<div class="settings-columns">
				<div class="setting-content">
					<label for="krawlet-api-key" class="setting-description">
						{$t$('settings.krawletApiKeyDescription')}
					</label>
					<input
						type="password"
						id="krawlet-api-key"
						class="api-key-input"
						bind:value={$settings.krawletApiKey}
						placeholder={$t$('settings.krawletApiKeyPlaceholder')}
						autocomplete="off"
					/>
				</div>
				{#if $settings.krawletApiKey}
					<div class="setting-preview api-key-preview">
						<div class="preview-label">
							<FontAwesomeIcon icon={faEye} /> {$t$('settings.apiKeyInfo')}
							<button
								type="button"
								class="refresh-btn"
								onclick={fetchApiKeyInfo}
								disabled={apiKeyLoading}
								aria-label={$t$('common.refresh')}
							>
								<FontAwesomeIcon icon={faSync} spin={apiKeyLoading} />
							</button>
						</div>
						<div class="preview-content api-key-info">
							{#if apiKeyLoading}
								<div class="api-key-loading">{$t$('common.loading')}</div>
							{:else if apiKeyError}
								<div class="api-key-error">
									<FontAwesomeIcon icon={faTimesCircle} />
									{apiKeyError}
								</div>
							{:else if apiKeyInfo}
								<div class="api-key-details">
									<div class="api-key-row">
										<span class="api-key-label">{$t$('settings.apiKeyName')}</span>
										<span class="api-key-value">{apiKeyInfo.name}</span>
									</div>
									<div class="api-key-row">
										<span class="api-key-label">{$t$('settings.apiKeyTier')}</span>
										<span class="api-key-value tier-{apiKeyInfo.tier}">{apiKeyInfo.tier}</span>
									</div>
									<div class="api-key-row">
										<span class="api-key-label">{$t$('settings.apiKeyStatus')}</span>
										<span class="api-key-value" class:active={apiKeyInfo.isActive} class:inactive={!apiKeyInfo.isActive}>
											<FontAwesomeIcon icon={apiKeyInfo.isActive ? faCheckCircle : faTimesCircle} />
											{apiKeyInfo.isActive ? $t$('settings.apiKeyActive') : $t$('settings.apiKeyInactive')}
										</span>
									</div>
									<div class="api-key-row">
										<span class="api-key-label">{$t$('settings.apiKeyRateLimit')}</span>
										<span class="api-key-value">{apiKeyInfo.rateLimit} {$t$('settings.apiKeyRequestsPerMinute')}</span>
									</div>
									{#if apiKeyInfo.usage}
										<div class="api-key-row">
											<span class="api-key-label">{$t$('settings.apiKeyUsage24h')}</span>
											<span class="api-key-value">{apiKeyInfo.usage.last24h.toLocaleString()} {$t$('settings.apiKeyRequests')}</span>
										</div>
										<div class="api-key-row">
											<span class="api-key-label">{$t$('settings.apiKeyUsage7d')}</span>
											<span class="api-key-value">{apiKeyInfo.usage.last7d.toLocaleString()} {$t$('settings.apiKeyRequests')}</span>
										</div>
									{/if}
									{#if apiKeyInfo.lastUsedAt}
										<div class="api-key-row">
											<span class="api-key-label">{$t$('settings.apiKeyLastUsed')}</span>
											<span class="api-key-value">{relativeTime(new Date(apiKeyInfo.lastUsedAt))}</span>
										</div>
									{/if}
								</div>
							{:else}
								<div class="api-key-empty">{$t$('settings.apiKeyNoInfo')}</div>
							{/if}
						</div>
					</div>
				{/if}
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

	.setting-description {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
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

	.datetime-preview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.datetime-example {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.datetime-example:last-child {
		border-bottom: none;
	}

	.datetime-label {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.85rem;
	}

	.datetime-value {
		font-family: monospace;
		color: var(--theme-color);
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

	.api-key-input {
		width: 100%;
		padding: 0.75rem;
		margin-top: 0.5rem;
		background-color: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--text-color-1);
		font-family: monospace;
		font-size: 0.9rem;
	}

	.api-key-input:focus {
		outline: none;
		border-color: var(--theme-color-2);
	}

	.api-key-input::placeholder {
		color: rgba(255, 255, 255, 0.3);
	}

	.api-key-preview {
		margin-top: 1rem;
	}

	.refresh-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		padding: 0.25rem;
		margin-left: auto;
		transition: color 0.2s ease;
	}

	.refresh-btn:hover:not(:disabled) {
		color: var(--theme-color-2);
	}

	.refresh-btn:disabled {
		cursor: not-allowed;
	}

	.api-key-info {
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		padding: 0.75rem;
	}

	.api-key-loading,
	.api-key-empty {
		text-align: center;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.85rem;
		padding: 0.5rem;
	}

	.api-key-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgb(var(--red));
		font-size: 0.85rem;
		padding: 0.5rem;
	}

	.api-key-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.api-key-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.api-key-row:last-child {
		border-bottom: none;
	}

	.api-key-label {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.8rem;
	}

	.api-key-value {
		font-size: 0.85rem;
		font-weight: 500;
	}

	.api-key-value.active {
		color: rgb(var(--green));
	}

	.api-key-value.inactive {
		color: rgb(var(--red));
	}

	.api-key-value.tier-free {
		color: rgba(255, 255, 255, 0.8);
	}

	.api-key-value.tier-premium {
		color: rgb(var(--theme-color-rgb));
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
