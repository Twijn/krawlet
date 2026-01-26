<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import settings from '$lib/stores/settings';
	import {
		faServer,
		faKey,
		faEye,
		faSync,
		faCheckCircle,
		faTimesCircle
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import { SYNC_NODE_OFFICIAL, SYNC_NODES } from '$lib/consts';
	import { notifications } from '$lib/stores/notifications';
	import { t, t$ } from '$lib/i18n';
	import { relativeTime } from '$lib/util';
	import krawletClient from '$lib/api/krawlet';

	// Infer ApiKeyInfo type from the client method
	type ApiKeyInfo = Awaited<ReturnType<typeof krawletClient.apiKey.getInfo>>;

	const API_KEY_COMMAND = '\\krawlet api';

	async function copyCommand() {
		try {
			await navigator.clipboard.writeText(API_KEY_COMMAND);
			notifications.success(t('common.copied'));
		} catch {
			notifications.error(t('wallet.addressCopyFailed'));
		}
	}

	let allowSyncNodeChange = $state($settings.syncNode !== SYNC_NODE_OFFICIAL.id);

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

<Section lgCols={12} mdCols={12} smCols={12}>
	<h2><FontAwesomeIcon icon={faServer} /> {$t$('settings.tabs.advanced')}</h2>

	<div class="settings-grid">
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
			<legend><FontAwesomeIcon icon={faKey} /> {$t$('settings.apiKeys')}</legend>
			<div class="settings-columns">
				<div class="setting-content">
					<label for="krawlet-api-key" class="setting-description">
						{$t$('settings.krawletApiKeyDescription')}
					</label>
					<small class="api-key-hint">
						{$t$('settings.krawletApiKeyHintPrefix')}
						<button type="button" class="command-copy" onclick={copyCommand} title={$t$('common.copy')}>
							{API_KEY_COMMAND}
						</button>
						{$t$('settings.krawletApiKeyHintSuffix')}
					</small>
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
							<FontAwesomeIcon icon={faEye} />
							{$t$('settings.apiKeyInfo')}
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
										<span
											class="api-key-value"
											class:active={apiKeyInfo.isActive}
											class:inactive={!apiKeyInfo.isActive}
										>
											<FontAwesomeIcon icon={apiKeyInfo.isActive ? faCheckCircle : faTimesCircle} />
											{apiKeyInfo.isActive
												? $t$('settings.apiKeyActive')
												: $t$('settings.apiKeyInactive')}
										</span>
									</div>
									<div class="api-key-row">
										<span class="api-key-label">{$t$('settings.apiKeyRateLimit')}</span>
										<span class="api-key-value"
											>{apiKeyInfo.rateLimit} {$t$('settings.apiKeyRequestsPerMinute')}</span
										>
									</div>
									{#if apiKeyInfo.usage}
										<div class="api-key-row">
											<span class="api-key-label">{$t$('settings.apiKeyUsage24h')}</span>
											<span class="api-key-value"
												>{apiKeyInfo.usage.last24h.toLocaleString()}
												{$t$('settings.apiKeyRequests')}</span
											>
										</div>
										<div class="api-key-row">
											<span class="api-key-label">{$t$('settings.apiKeyUsage7d')}</span>
											<span class="api-key-value"
												>{apiKeyInfo.usage.last7d.toLocaleString()}
												{$t$('settings.apiKeyRequests')}</span
											>
										</div>
									{/if}
									{#if apiKeyInfo.lastUsedAt}
										<div class="api-key-row">
											<span class="api-key-label">{$t$('settings.apiKeyLastUsed')}</span>
											<span class="api-key-value"
												>{relativeTime(new Date(apiKeyInfo.lastUsedAt))}</span
											>
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

	.api-key-hint {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.command-copy {
		display: inline;
		background: rgba(0, 0, 0, 0.3);
		border: none;
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-family: monospace;
		font-size: 0.85rem;
		color: var(--theme-color);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.command-copy:hover {
		background: rgba(0, 0, 0, 0.5);
		color: var(--theme-color-2);
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
	}

	@media (max-width: 768px) {
		.settings-group {
			padding: 0.75rem;
		}
	}
</style>
