<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPlus, faTrash, faWallet, faDownload } from '@fortawesome/free-solid-svg-icons';
	import { notificationSettings, type MonitoredAddress } from '$lib/stores/notificationSettings';
	import settings from '$lib/stores/settings';
	import { notifications } from '$lib/stores/notifications';
	import { t, t$ } from '$lib/i18n';
	import { slide } from 'svelte/transition';

	let newAddress = $state('');
	let newLabel = $state('');
	let showAddForm = $state(false);

	function handleAddAddress() {
		const address = newAddress.trim();
		if (!address) {
			notifications.warning(t('pushNotifications.enterAddress'));
			return;
		}

		// Basic Krist address validation (10 characters, starts with k)
		if (!/^k[a-z0-9]{9}$/i.test(address)) {
			notifications.warning(t('pushNotifications.invalidAddress'));
			return;
		}

		notificationSettings.addMonitoredAddress(address, newLabel.trim() || undefined);
		notifications.success(t('pushNotifications.addressAdded', { address }));

		// Reset form
		newAddress = '';
		newLabel = '';
		showAddForm = false;
	}

	function handleRemoveAddress(address: string) {
		notificationSettings.removeMonitoredAddress(address);
		notifications.info(t('pushNotifications.addressRemoved', { address }));
	}

	function handleToggleAddress(address: string, enabled: boolean) {
		notificationSettings.toggleAddressMonitoring(address, enabled);
	}

	function handleImportFromWallets() {
		const wallets = $settings.wallets.map((w) => ({
			address: w.address,
			name: w.name
		}));

		if (wallets.length === 0) {
			notifications.warning(t('pushNotifications.noWalletsToImport'));
			return;
		}

		const imported = notificationSettings.importFromWallets(wallets);

		if (imported > 0) {
			notifications.success(t('pushNotifications.walletsImported', { count: imported.toString() }));
		} else {
			notifications.info(t('pushNotifications.allWalletsAlreadyAdded'));
		}
	}

	function truncateAddress(address: string): string {
		if (address.length <= 10) return address;
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}
</script>

<fieldset>
	<legend>{$t$('pushNotifications.monitoredAddresses')}</legend>

	<!-- Import from wallets button -->
	{#if $settings.wallets.length > 0}
		<div class="import-section">
			<Button onClick={handleImportFromWallets}>
				<FontAwesomeIcon icon={faDownload} />
				{$t$('pushNotifications.importFromWallets')}
			</Button>
			<small>{$t$('pushNotifications.importFromWalletsHint')}</small>
		</div>
	{/if}

	<!-- List of monitored addresses -->
	{#if $notificationSettings.monitoredAddresses.length > 0}
		<ul class="address-list">
			{#each $notificationSettings.monitoredAddresses as addr (addr.address)}
				<li class="address-item" transition:slide>
					<div class="address-info">
						<ToggleCheckbox
							checked={addr.enabled}
							onChange={() => handleToggleAddress(addr.address, !addr.enabled)}
						>
							<span class="address-label">
								{#if addr.label}
									<strong>{addr.label}</strong>
									<span class="address-value">({truncateAddress(addr.address)})</span>
								{:else}
									<code>{addr.address}</code>
								{/if}
							</span>
						</ToggleCheckbox>
					</div>
					<button
						class="remove-btn"
						onclick={() => handleRemoveAddress(addr.address)}
						aria-label={$t$('pushNotifications.removeAddress')}
					>
						<FontAwesomeIcon icon={faTrash} />
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="no-addresses">{$t$('pushNotifications.noAddressesMonitored')}</p>
	{/if}

	<!-- Add new address -->
	{#if showAddForm}
		<div class="add-form" transition:slide>
			<div class="form-row">
				<label for="new-address">{$t$('pushNotifications.address')}</label>
				<input
					type="text"
					id="new-address"
					bind:value={newAddress}
					placeholder="kxxxxxxxxx"
					maxlength="10"
				/>
			</div>
			<div class="form-row">
				<label for="new-label">{$t$('pushNotifications.label')}</label>
				<input
					type="text"
					id="new-label"
					bind:value={newLabel}
					placeholder={$t$('pushNotifications.labelPlaceholder')}
				/>
			</div>
			<div class="form-actions">
				<Button onClick={handleAddAddress}>
					<FontAwesomeIcon icon={faPlus} />
					{$t$('pushNotifications.addAddress')}
				</Button>
				<Button onClick={() => (showAddForm = false)}>
					{$t$('common.cancel')}
				</Button>
			</div>
		</div>
	{:else}
		<Button onClick={() => (showAddForm = true)}>
			<FontAwesomeIcon icon={faPlus} />
			{$t$('pushNotifications.addNewAddress')}
		</Button>
	{/if}
</fieldset>

<style>
	.import-section {
		margin-bottom: 1rem;
	}

	.import-section small {
		display: block;
		margin-top: 0.25rem;
		opacity: 0.75;
		font-size: 0.875rem;
	}

	.address-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem 0;
	}

	.address-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.address-info {
		flex: 1;
		min-width: 0;
	}

	.address-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.address-value {
		opacity: 0.75;
		font-size: 0.875rem;
	}

	code {
		font-family: monospace;
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
	}

	.remove-btn {
		background: none;
		border: none;
		color: var(--error-color, #ef4444);
		cursor: pointer;
		padding: 0.5rem;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.remove-btn:hover {
		opacity: 1;
	}

	.no-addresses {
		opacity: 0.75;
		font-style: italic;
		margin: 0.5rem 0 1rem 0;
	}

	.add-form {
		margin-top: 1rem;
		padding: 1rem;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
	}

	.form-row {
		margin-bottom: 0.75rem;
	}

	.form-row label {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	.form-row input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.25rem;
		background-color: var(--background-color-1);
		color: var(--text-color-1);
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>
