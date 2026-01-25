<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import settings from '$lib/stores/settings';
	import { faGlobe, faClock, faEye } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { t, t$, locale, LOCALES, type LocaleCode } from '$lib/i18n';
	import { relativeTime } from '$lib/util';

	// Preview dates for datetime settings
	const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
	const olderDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

	// Language options for the selector
	const languageOptions = Object.entries(LOCALES).map(([code, info]) => ({
		id: code,
		name: `${info.nativeName} (${info.name})`
	}));

	function onLanguageChange() {
		locale.set($settings.language as LocaleCode);
		notifications.success(t('notifications.success'));
	}

	function onRelativeTimeChange() {
		if (!$settings.relativeTimeEnabled) {
			$settings.relativeTimeAbove7d = false;
		}
	}
</script>

<Section lgCols={12} mdCols={12} smCols={12}>
	<h2><FontAwesomeIcon icon={faGlobe} /> {$t$('settings.tabs.general')}</h2>

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
