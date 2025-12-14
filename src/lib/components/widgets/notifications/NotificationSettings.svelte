<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faBell,
		faBellSlash,
		faCheck,
		faTimes,
		faQuestionCircle,
		faVial
	} from '@fortawesome/free-solid-svg-icons';
	import { notificationSettings } from '$lib/stores/notificationSettings';
	import { notificationPermission } from '$lib/stores/pwa';
	import {
		requestNotificationPermission,
		getNotificationPermission,
		areNotificationsSupported,
		sendTestNotification
	} from '$lib/utils/notifications';
	import { notifications } from '$lib/stores/notifications';
	import { t, t$ } from '$lib/i18n';
	import { browser } from '$app/environment';
	import AddressMonitorList from './AddressMonitorList.svelte';
	import EventTypeSelector from './EventTypeSelector.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let permissionStatus = $state<NotificationPermission>(
		browser ? getNotificationPermission() : 'default'
	);
	let isRequestingPermission = $state(false);
	let notificationsSupported = $state(browser ? areNotificationsSupported() : false);

	// Sync permission status with store
	$effect(() => {
		if (browser) {
			permissionStatus = $notificationPermission;
		}
	});

	async function handleRequestPermission() {
		isRequestingPermission = true;
		try {
			const result = await requestNotificationPermission();
			permissionStatus = result;
			notificationPermission.set(result);

			if (result === 'granted') {
				notifications.success(t('pushNotifications.permissionGranted'));
				// Enable notifications by default when permission is granted
				notificationSettings.setEnabled(true);
			} else if (result === 'denied') {
				notifications.error(t('pushNotifications.permissionDenied'));
				notificationSettings.setEnabled(false);
			}
		} catch (error) {
			console.error('Failed to request permission:', error);
			notifications.error(t('errors.unknownError'));
		} finally {
			isRequestingPermission = false;
		}
	}

	function handleTestNotification() {
		if (permissionStatus !== 'granted') {
			notifications.warning(t('pushNotifications.permissionRequired'));
			return;
		}

		const sent = sendTestNotification();
		if (sent) {
			notifications.info(t('pushNotifications.testSent'));
		} else {
			notifications.error(t('pushNotifications.testFailed'));
		}
	}

	function onEnabledChange() {
		if ($notificationSettings.enabled && permissionStatus !== 'granted') {
			notifications.warning(t('pushNotifications.permissionRequired'));
			notificationSettings.setEnabled(false);
		}
	}

	function getPermissionIcon() {
		switch (permissionStatus) {
			case 'granted':
				return faCheck;
			case 'denied':
				return faTimes;
			default:
				return faQuestionCircle;
		}
	}

	function getPermissionColor() {
		switch (permissionStatus) {
			case 'granted':
				return 'var(--success-color, #22c55e)';
			case 'denied':
				return 'var(--error-color, #ef4444)';
			default:
				return 'var(--warning-color, #f59e0b)';
		}
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faBell} /> {$t$('pushNotifications.title')}</h2>

	{#if !notificationsSupported}
		<div class="unsupported-warning">
			<FontAwesomeIcon icon={faBellSlash} />
			<p>{$t$('pushNotifications.notSupported')}</p>
		</div>
	{:else}
		<!-- Permission Status -->
		<fieldset>
			<legend>{$t$('pushNotifications.permission')}</legend>
			<div class="permission-status">
				<span class="status-indicator" style="color: {getPermissionColor()}">
					<FontAwesomeIcon icon={getPermissionIcon()} />
					{$t$(`pushNotifications.permissionStatus.${permissionStatus}`)}
				</span>

				{#if permissionStatus === 'default'}
					<Button
						onClick={() => {
							handleRequestPermission();
						}}
						disabled={isRequestingPermission}
					>
						{#if isRequestingPermission}
							{$t$('common.loading')}
						{:else}
							{$t$('pushNotifications.requestPermission')}
						{/if}
					</Button>
				{:else if permissionStatus === 'denied'}
					<p class="permission-hint">{$t$('pushNotifications.deniedHint')}</p>
				{/if}
			</div>
		</fieldset>

		<!-- Main Toggle -->
		<fieldset>
			<legend>{$t$('pushNotifications.settings')}</legend>
			<ToggleCheckbox
				bind:checked={$notificationSettings.enabled}
				disabled={permissionStatus !== 'granted'}
				onChange={onEnabledChange}
			>
				{$t$('pushNotifications.enableNotifications')}
			</ToggleCheckbox>

			{#if permissionStatus !== 'granted'}
				<small class="toggle-hint">{$t$('pushNotifications.grantPermissionFirst')}</small>
			{/if}
		</fieldset>

		{#if $notificationSettings.enabled}
			<!-- Monitored Addresses -->
			<AddressMonitorList />

			<!-- Event Types -->
			<EventTypeSelector />

			<!-- Filters -->
			<fieldset>
				<legend>{$t$('pushNotifications.filters')}</legend>
				<label for="min-amount">{$t$('pushNotifications.minAmount')}</label>
				<input
					type="number"
					id="min-amount"
					min="0"
					step="1"
					placeholder={$t$('pushNotifications.minAmountPlaceholder')}
					value={$notificationSettings.filters.minTransactionAmount ?? ''}
					onchange={(e) => {
						const value = e.currentTarget.value;
						notificationSettings.setMinTransactionAmount(value ? parseInt(value, 10) : undefined);
					}}
				/>
				<small>{$t$('pushNotifications.minAmountHint')}</small>
			</fieldset>

			<!-- Preferences -->
			<fieldset>
				<legend>{$t$('pushNotifications.preferences')}</legend>
				<ToggleCheckbox bind:checked={$notificationSettings.preferences.sound}>
					{$t$('pushNotifications.playSound')}
				</ToggleCheckbox>
				<ToggleCheckbox bind:checked={$notificationSettings.preferences.vibrate}>
					{$t$('pushNotifications.vibrate')}
				</ToggleCheckbox>
				<ToggleCheckbox bind:checked={$notificationSettings.preferences.showAmount}>
					{$t$('pushNotifications.showAmount')}
				</ToggleCheckbox>
				<ToggleCheckbox bind:checked={$notificationSettings.preferences.showSender}>
					{$t$('pushNotifications.showSender')}
				</ToggleCheckbox>
				<ToggleCheckbox bind:checked={$notificationSettings.preferences.groupSimilar}>
					{$t$('pushNotifications.groupSimilar')}
				</ToggleCheckbox>
			</fieldset>

			<!-- Test Notification -->
			<fieldset>
				<legend>{$t$('pushNotifications.testing')}</legend>
				<Button onClick={handleTestNotification}>
					<FontAwesomeIcon icon={faVial} />
					{$t$('pushNotifications.sendTest')}
				</Button>
				<small>{$t$('pushNotifications.testHint')}</small>
			</fieldset>
		{/if}
	{/if}
</Section>

<style>
	.unsupported-warning {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background-color: rgba(239, 68, 68, 0.1);
		border-radius: 0.5rem;
		color: var(--error-color, #ef4444);
	}

	.permission-status {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
	}

	.permission-hint {
		font-size: 0.875rem;
		opacity: 0.75;
		margin: 0;
	}

	.toggle-hint {
		display: block;
		margin-top: 0.25rem;
		opacity: 0.75;
	}

	fieldset {
		margin-bottom: 1rem;
		padding: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
	}

	legend {
		font-weight: 500;
		padding: 0 0.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	input[type='number'] {
		width: 100%;
		max-width: 200px;
		padding: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.25rem;
		background-color: var(--background-color-1);
		color: var(--text-color-1);
	}

	small {
		display: block;
		margin-top: 0.25rem;
		opacity: 0.75;
		font-size: 0.875rem;
	}
</style>
