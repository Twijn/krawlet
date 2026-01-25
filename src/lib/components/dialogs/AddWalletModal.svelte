<script lang="ts">
	import { addWalletModal } from '$lib/stores/addWalletModal';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { t$ } from '$lib/i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faDice } from '@fortawesome/free-solid-svg-icons';
	import kromer from '$lib/api/kromer';
	import type { APIError } from 'kromer';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import settings from '$lib/stores/settings';

	let masterPassword = $state('');
	let name = $state('');
	let pkey = $state('');
	let submitting = $state(false);

	let decodedAddress = $derived(
		pkey.length === 0 ? '' : kromer.addresses.decodeAddressFromPrivateKey(pkey)
	);

	function generatePrivateKey() {
		const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		const randomValues = new Uint8Array(64);
		crypto.getRandomValues(randomValues);
		for (let i = 0; i < 64; i++) {
			result += chars[randomValues[i] % chars.length];
		}
		pkey = result;

		// Copy to clipboard
		navigator.clipboard.writeText(result).then(
			() => {
				notifications.success($t$('wallet.privateKeyGenerated'));
			},
			() => {
				notifications.error($t$('wallet.privateKeyCopyFailed'));
			}
		);
	}

	function handlePrivateKeyButton() {
		if (pkey.length > 0) {
			// Show confirm dialog to clear
			confirm.confirm({
				message: $t$('wallet.confirmClearPrivateKey'),
				danger: true,
				confirmButtonLabel: $t$('wallet.clearPrivateKey'),
				confirm: () => {
					pkey = '';
					notifications.success($t$('wallet.privateKeyCleared'));
				}
			});
		} else {
			// Generate new private key
			generatePrivateKey();
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (masterPassword.length < 8) {
			notifications.error($t$('wallet.masterPasswordMinLength'));
			return false;
		}

		submitting = true;

		try {
			const address = kromer.addresses.decodeAddressFromPrivateKey(pkey);
			await settings.addWallet(
				{
					name,
					address,
					private: pkey
				},
				masterPassword,
				kromer
			);

			notifications.success($t$('wallet.walletAddSuccess', { name, address }));

			// Reset form
			name = '';
			pkey = '';
			masterPassword = '';

			// Call onSuccess callback if provided
			if ($addWalletModal.onSuccess) {
				$addWalletModal.onSuccess();
			}

			// Close modal
			addWalletModal.close();
		} catch (e) {
			const err = e as APIError;
			notifications.error(err.message ?? 'Unknown Error!');
		} finally {
			submitting = false;
		}

		return false;
	}

	function handleClose() {
		if (pkey.length > 0 || name.length > 0) {
			confirm.confirm({
				message: $t$('wallet.confirmCloseWithData'),
				danger: true,
				confirmButtonLabel: $t$('common.close'),
				confirm: () => {
					addWalletModal.close();
					// Reset form
					name = '';
					pkey = '';
					masterPassword = '';
				}
			});
		} else {
			addWalletModal.close();
		}
	}
</script>

<Modal open={$addWalletModal.open} title={$t$('wallet.newWallet')} onClose={handleClose}>
	<form method="POST" onsubmit={handleSubmit}>
		<label>
			{$t$('wallet.masterPassword')}
			<input
				id="masterPassword"
				type="password"
				name="masterPassword"
				bind:value={masterPassword}
				required
				autocomplete="new-password"
			/>
			<small>
				{#if $settings.wallets.length > 0}
					{$t$('wallet.masterPasswordSameHint')}
				{/if}
				{$t$('wallet.masterPasswordHint')}
			</small>
		</label>

		<label>
			{$t$('name.name')}
			<input type="text" name="name" bind:value={name} required autocomplete="off" />
			<small>{$t$('wallet.nameHint')}</small>
		</label>

		<label>
			{$t$('wallet.privateKey')}
			<input type="password" name="pkey" bind:value={pkey} required autocomplete="off" />
			<small>{$t$('wallet.privateKeyHint')}</small>
		</label>

		<div class="button-group">
			<Button type="button" full={true} onClick={handlePrivateKeyButton} variant="secondary">
				<FontAwesomeIcon icon={faDice} />
				{#if pkey.length > 0}
					{$t$('wallet.clearPrivateKey')}
				{:else}
					{$t$('wallet.generatePrivateKey')}
				{/if}
			</Button>
		</div>

		{#if decodedAddress.length === 10}
			<div class="decoded-address">
				<strong>{$t$('wallet.decodedAddress')}:</strong>
				{decodedAddress}
			</div>
		{/if}

		<div class="modal-buttons">
			<Button type="button" variant="secondary" onClick={handleClose}>
				{$t$('common.cancel')}
			</Button>
			<Button type="submit" variant="primary" disabled={submitting}>
				{submitting ? $t$('common.loading') : $t$('wallet.addWallet')}
			</Button>
		</div>
	</form>
</Modal>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: var(--text-color-1);
		font-weight: 500;
	}

	input {
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		background: rgba(0, 0, 0, 0.2);
		color: var(--text-color-1);
		font-size: 1rem;
		transition: border-color 0.2s ease;
	}

	input:focus {
		outline: none;
		border-color: var(--theme-color);
	}

	small {
		font-size: 0.875rem;
		color: var(--text-color-2);
		font-weight: normal;
	}

	.button-group {
		margin-bottom: 0.5rem;
	}

	.decoded-address {
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.5rem;
		text-align: center;
		font-family: monospace;
		font-size: 0.9rem;
	}

	.decoded-address strong {
		display: block;
		margin-bottom: 0.25rem;
		color: var(--text-color-2);
	}

	.modal-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
