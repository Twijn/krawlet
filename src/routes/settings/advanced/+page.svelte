<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import settings from '$lib/stores/settings';
	import {
		faServer,
		faKey,
		faEye,
		faSync,
		faCheckCircle,
		faTimesCircle,
		faCopy,
		faBolt,
		faArrowRight,
		faRotateLeft,
		faCode,
		faExternalLinkAlt
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import { SYNC_NODE_OFFICIAL, SYNC_NODES } from '$lib/consts';
	import { notifications } from '$lib/stores/notifications';
	import { t, t$ } from '$lib/i18n';
	import { relativeTime } from '$lib/util';
	import krawletClient, { getKrawletClient, isValidApiKey } from '$lib/api/krawlet';
	import { confirm } from '$lib/stores/confirm';
	import { browser } from '$app/environment';

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
		// Only fetch info for valid API keys (must start with 'kraw_')
		if (!$settings.krawletApiKey || !isValidApiKey($settings.krawletApiKey)) {
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
		// Only fetch info for valid API keys (must start with 'kraw_')
		if ($settings.krawletApiKey && isValidApiKey($settings.krawletApiKey)) {
			// Small delay to allow the client to update with the new key
			setTimeout(fetchApiKeyInfo, 100);
		} else {
			apiKeyInfo = null;
			apiKeyError = null;
		}
	});

	// Quick Code state
	let quickCodeInput = $state('');
	let quickCodeLoading = $state(false);
	let quickCodeError: string | null = $state(null);
	let quickCodeMode: 'redeem' | 'generate' = $state('redeem');
	let generatedApiKey: string | null = $state(null);

	// Prefill quick code from URL hash (e.g., /settings/advanced#123456)
	// Hash is used for security - it's not sent to the server
	$effect(() => {
		if (browser && window.location.hash) {
			const hashCode = window.location.hash.slice(1); // Remove the '#'
			if (hashCode) {
				quickCodeInput = hashCode;
				// Clear the hash from URL for security (without triggering navigation)
				history.replaceState(null, '', window.location.pathname + window.location.search);
			}
		}
	});

	async function copyApiKey() {
		if (!$settings.krawletApiKey) return;
		try {
			await navigator.clipboard.writeText($settings.krawletApiKey);
			notifications.success(t('common.copied'));
		} catch {
			notifications.error(t('wallet.addressCopyFailed'));
		}
	}

	async function redeemQuickCode() {
		if (!quickCodeInput.trim()) return;

		// If there's already an API key, confirm overwrite
		if ($settings.krawletApiKey) {
			confirm.confirm({
				message: t('settings.quickCodeOverwriteConfirm'),
				danger: true,
				confirmButtonLabel: t('common.confirm'),
				cancelButtonLabel: t('common.cancel'),
				confirm: () => doRedeemQuickCode()
			});
		} else {
			doRedeemQuickCode();
		}
	}

	async function doRedeemQuickCode() {
		quickCodeLoading = true;
		quickCodeError = null;

		try {
			const response = await getKrawletClient().apiKey.redeemQuickCode(quickCodeInput.trim());
			$settings.krawletApiKey = response.apiKey;
			notifications.success(t('settings.quickCodeRedeemed', { name: response.name }));
			quickCodeInput = '';
			if (response.warning) {
				notifications.warning(response.warning);
			}
		} catch (err: unknown) {
			console.error('Failed to redeem quick code:', err);
			quickCodeError = err instanceof Error ? err.message : t('settings.quickCodeRedeemFailed');
		} finally {
			quickCodeLoading = false;
		}
	}

	async function generateQuickCode() {
		if (!quickCodeInput.trim()) return;

		quickCodeLoading = true;
		quickCodeError = null;
		generatedApiKey = null;

		try {
			const response = await getKrawletClient().apiKey.redeemQuickCode(quickCodeInput.trim());
			generatedApiKey = response.apiKey;
			notifications.success(t('settings.quickCodeGenerated'));
			if (response.warning) {
				notifications.warning(response.warning);
			}
		} catch (err: unknown) {
			console.error('Failed to generate API key from quick code:', err);
			quickCodeError = err instanceof Error ? err.message : t('settings.quickCodeRedeemFailed');
		} finally {
			quickCodeLoading = false;
		}
	}

	async function copyGeneratedApiKey() {
		if (!generatedApiKey) return;
		try {
			await navigator.clipboard.writeText(generatedApiKey);
			notifications.success(t('common.copied'));
		} catch {
			notifications.error(t('wallet.addressCopyFailed'));
		}
	}

	function clearGeneratedApiKey() {
		generatedApiKey = null;
		quickCodeInput = '';
		quickCodeError = null;
	}
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
						<button
							type="button"
							class="command-copy"
							onclick={copyCommand}
							title={$t$('common.copy')}
						>
							{API_KEY_COMMAND}
						</button>
						{$t$('settings.krawletApiKeyHintSuffix')}
					</small>
					<div class="api-key-input-wrapper">
						<input
							type="password"
							id="krawlet-api-key"
							class="api-key-input"
							bind:value={$settings.krawletApiKey}
							placeholder={$t$('settings.krawletApiKeyPlaceholder')}
							autocomplete="off"
						/>
						{#if $settings.krawletApiKey}
							<button
								type="button"
								class="api-key-copy-btn"
								onclick={copyApiKey}
								title={$t$('common.copy')}
								aria-label={$t$('common.copy')}
							>
								<FontAwesomeIcon icon={faCopy} />
							</button>
						{/if}
					</div>

					<!-- Quick Code Section -->
					<div class="quick-code-section">
						<span class="setting-description quick-code-label">
							<FontAwesomeIcon icon={faBolt} />
							{$t$('settings.quickCode')}
						</span>
						<small class="api-key-hint">
							{$t$('settings.quickCodeDescription')}
						</small>

						<ToggleCheckbox
							checked={quickCodeMode === 'redeem'}
							onChange={() => {
								quickCodeMode = quickCodeMode === 'redeem' ? 'generate' : 'redeem';
								generatedApiKey = null;
								quickCodeError = null;
							}}
						>
							{$t$('settings.quickCodeSaveToKrawlet')}
						</ToggleCheckbox>

						<div class="quick-code-input-wrapper">
							<input
								type="text"
								class="quick-code-input"
								bind:value={quickCodeInput}
								placeholder={$t$('settings.quickCodePlaceholder')}
								autocomplete="off"
								disabled={quickCodeLoading}
							/>
							<Button
								variant="primary"
								onClick={() => {
									if (quickCodeMode === 'redeem') {
										redeemQuickCode();
									} else {
										generateQuickCode();
									}
								}}
								disabled={!quickCodeInput.trim() || quickCodeLoading}
								loading={quickCodeLoading}
							>
								<FontAwesomeIcon icon={faArrowRight} />
								{$t$('settings.quickCodeRedeem')}
							</Button>
						</div>

						{#if quickCodeError}
							<div class="quick-code-error">
								<FontAwesomeIcon icon={faTimesCircle} />
								{quickCodeError}
							</div>
						{/if}

						{#if generatedApiKey}
							<div class="generated-key-display">
								<span class="generated-key-label">{$t$('settings.generatedApiKey')}</span>
								<div class="generated-key-wrapper">
									<code class="generated-key">{generatedApiKey}</code>
									<Button
										variant="success"
										size="small"
										onClick={() => {
											copyGeneratedApiKey();
										}}
									>
										<FontAwesomeIcon icon={faCopy} />
										{$t$('common.copy')}
									</Button>
								</div>
								<div class="generated-key-actions">
									<Button
										variant="secondary"
										size="small"
										onClick={() => {
											clearGeneratedApiKey();
										}}
									>
										<FontAwesomeIcon icon={faRotateLeft} />
										{$t$('settings.quickCodeClear')}
									</Button>
								</div>
							</div>
						{/if}
					</div>
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

		<fieldset class="settings-group">
			<legend><FontAwesomeIcon icon={faCode} /> {$t$('settings.developerResources')}</legend>
			<div class="developer-resources">
				<p class="resources-description">{$t$('settings.developerResourcesDescription')}</p>
				<div class="resource-cards">
					<a
						href="https://www.npmjs.com/package/krawlet-js"
						target="_blank"
						rel="noopener noreferrer"
						class="resource-card"
					>
						<div class="resource-icon ts-icon">
							<span class="ts-text">TS</span>
						</div>
						<div class="resource-content">
							<h3>Krawlet-js</h3>
							<p>{$t$('settings.krawletJsDescription')}</p>
							<span class="resource-link">
								npmjs.com
								<FontAwesomeIcon icon={faExternalLinkAlt} />
							</span>
						</div>
					</a>
					<a
						href="https://krawlet.cc/docs/lua"
						target="_blank"
						rel="noopener noreferrer"
						class="resource-card"
					>
						<div class="resource-icon lua-icon">
							<FontAwesomeIcon icon={faCode} />
						</div>
						<div class="resource-content">
							<h3>Krawlet Lua</h3>
							<p>{$t$('settings.krawletLuaDescription')}</p>
							<span class="resource-link">
								krawlet.cc/docs
								<FontAwesomeIcon icon={faExternalLinkAlt} />
							</span>
						</div>
					</a>
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

	.api-key-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		margin-top: 0.5rem;
	}

	.api-key-input {
		width: 100%;
		padding: 0.75rem;
		padding-right: 2.5rem;
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

	.api-key-copy-btn {
		position: absolute;
		right: 0.5rem;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.25rem;
		transition: all 0.2s ease;
	}

	.api-key-copy-btn:hover {
		color: var(--theme-color-2);
		background: rgba(255, 255, 255, 0.05);
	}

	/* Quick Code Styles */
	.quick-code-section {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.quick-code-section .setting-description {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.quick-code-section .setting-description :global(svg) {
		color: var(--theme-color);
	}

	.quick-code-input-wrapper {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.quick-code-input {
		flex: 1;
		padding: 0.75rem;
		background-color: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--text-color-1);
		font-family: monospace;
		font-size: 0.9rem;
	}

	.quick-code-input:focus {
		outline: none;
		border-color: var(--theme-color-2);
	}

	.quick-code-input::placeholder {
		color: rgba(255, 255, 255, 0.3);
	}

	.quick-code-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.quick-code-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		color: rgb(var(--red));
		font-size: 0.85rem;
	}

	.quick-code-hint {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.generated-key-display {
		margin-top: 0.75rem;
		padding: 1rem;
		background-color: rgba(var(--green), 0.1);
		border: 1px solid rgba(var(--green), 0.3);
		border-radius: 0.5rem;
	}

	.generated-key-label {
		display: block;
		font-size: 0.8rem;
		color: rgb(var(--green));
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.generated-key-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.generated-key {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-radius: 0.25rem;
		font-family: monospace;
		font-size: 0.85rem;
		word-break: break-all;
		color: var(--text-color-1);
	}

	.generated-key-actions {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(var(--green), 0.2);
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

	/* Developer Resources Styles */
	.developer-resources {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.resources-description {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.875rem;
		margin: 0;
		line-height: 1.5;
	}

	.resource-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.25rem;
	}

	.resource-card {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 1.25rem;
		padding: 1.25rem 1.5rem;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.04) 0%,
			rgba(255, 255, 255, 0.01) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.75rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.resource-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.05) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.resource-card:hover {
		border-color: rgba(var(--theme-color-rgb), 0.4);
		transform: translateY(-3px);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.25),
			0 4px 12px rgba(var(--theme-color-rgb), 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.resource-card:hover::before {
		opacity: 1;
	}

	.resource-icon {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0.75rem;
		flex-shrink: 0;
		transition: all 0.3s ease;
	}

	.resource-card:hover .resource-icon {
		transform: scale(1.05);
	}

	.resource-icon :global(svg) {
		width: 1.75rem;
		height: 1.75rem;
	}

	.resource-icon.ts-icon {
		background: linear-gradient(135deg, rgba(49, 120, 198, 0.25) 0%, rgba(49, 120, 198, 0.15) 100%);
		color: #3178c6;
		box-shadow:
			0 2px 8px rgba(49, 120, 198, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.ts-text {
		font-weight: 800;
		font-size: 1.15rem;
		letter-spacing: -0.5px;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.resource-icon.lua-icon {
		background: linear-gradient(135deg, rgba(0, 0, 180, 0.25) 0%, rgba(0, 0, 128, 0.15) 100%);
		color: #7eb0e0;
		box-shadow:
			0 2px 8px rgba(0, 0, 128, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.resource-content {
		flex: 1;
		min-width: 0;
		position: relative;
		z-index: 1;
	}

	.resource-content h3 {
		margin: 0 0 0.375rem 0;
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text-color-1);
		letter-spacing: -0.01em;
	}

	.resource-content p {
		margin: 0 0 0.75rem 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.55);
		line-height: 1.5;
	}

	.resource-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--theme-color-2);
		padding: 0.35rem 0.65rem;
		background: rgba(var(--theme-color-rgb), 0.1);
		border-radius: 0.375rem;
		transition: all 0.2s ease;
	}

	.resource-card:hover .resource-link {
		background: rgba(var(--theme-color-rgb), 0.15);
		color: var(--theme-color);
	}

	.resource-link :global(svg) {
		width: 0.65rem;
		height: 0.65rem;
		transition: transform 0.2s ease;
	}

	.resource-card:hover .resource-link :global(svg) {
		transform: translateX(2px);
	}

	@media (max-width: 768px) {
		.settings-group {
			padding: 0.75rem;
		}

		.resource-cards {
			grid-template-columns: 1fr;
		}
	}
</style>
