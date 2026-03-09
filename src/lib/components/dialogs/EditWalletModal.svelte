<script lang="ts">
	import { editWalletModal } from '$lib/stores/editWalletModal';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { t, t$ } from '$lib/i18n';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCopy, faTrash } from '@fortawesome/free-solid-svg-icons';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import settings from '$lib/stores/settings';
	import { masterPasswordStore } from '$lib/stores/masterPassword';

	let name = $state('');
	let originalWallet = $state($editWalletModal.wallet);

	// Watch for modal open and initialize values
	$effect(() => {
		if ($editWalletModal.open && $editWalletModal.wallet) {
			originalWallet = $editWalletModal.wallet;
			name = $editWalletModal.wallet.name;
		}
	});

	async function onSubmit() {
		if (!originalWallet) {
			notifications.error($t$('common.error'));
			return;
		}

		try {
			// Update wallet name
			await settings.updateWallet(originalWallet.address, { name });

			notifications.success($t$('wallet.walletEditSuccess', { name }));

			// Reset form
			name = '';

			// Call onSuccess callback if provided
			if ($editWalletModal.onSuccess) {
				$editWalletModal.onSuccess();
			}

			// Close modal
			editWalletModal.close();
		} catch (e) {
			const err = e as Error;
			notifications.error(err.message ?? 'Unknown Error!');
		}
	}

	function onClose() {
		if (originalWallet && name !== originalWallet.name) {
			confirm.confirm({
				message: $t$('wallet.confirmCloseWithData'),
				danger: true,
				confirmButtonLabel: $t$('common.close'),
				confirm: () => {
					editWalletModal.close();
					// Reset form
					name = '';
				}
			});
		} else {
			editWalletModal.close();
		}
	}

	async function handleCopyPrivateKey() {
		if (!originalWallet) return;

		masterPasswordStore.get().then(async (password) => {
			if (!originalWallet) {
				notifications.error($t$('common.error'));
				return;
			}
			try {
				const privateKey = await settings.decryptWallet(originalWallet, password);
				if (!privateKey) {
					notifications.error($t$('wallet.privateKeyCopyError'));
					return;
				}
				await navigator.clipboard.writeText(privateKey);
				notifications.success($t$('wallet.privateKeyCopied'));
			} catch {
				notifications.error($t$('wallet.privateKeyCopyError'));
			}
		}).catch(() => {
			notifications.error($t$('wallet.invalidPassword'));
		});
	}

	function handleDeleteWallet() {
		if (!originalWallet) {
			notifications.error($t$('common.error'));
			return;
		}

		confirm.confirm({
			message: t('wallet.confirmDelete', {
				name: originalWallet.name,
				address: originalWallet.address
			}),
			danger: true,
			confirmButtonLabel: t('common.delete'),
			confirm: () => {
				if (!originalWallet) {
					notifications.error($t$('common.error'));
					return;
				}

				settings.removeWallet(originalWallet.address);
				notifications.success(
					t('wallet.deleteSuccess', { name: originalWallet.name, address: originalWallet.address })
				);
				editWalletModal.close();
			}
		});
	}
</script>

<Modal
	open={$editWalletModal.open}
	tt="wallet.editWallet"
	confirmButtonOverrides={{ tk: 'common.save' }}
	{onSubmit} {onClose}>
	<label>
		{$t$('name.name')}
		<input type="text" name="name" bind:value={name} required autocomplete="off" />
		<small>{$t$('wallet.nameHint')}</small>
	</label>

	{#if originalWallet}
		<div class="wallet-info">
			<strong>{$t$('wallet.address')}:</strong>
			<code>{originalWallet.address}</code>
		</div>
	{/if}

	<div class="button-group">
		<Button type="button" onClick={handleCopyPrivateKey} variant="secondary">
			<FontAwesomeIcon icon={faCopy} />
			{$t$('wallet.copyPrivateKey')}
		</Button>
		<Button type="button" onClick={handleDeleteWallet} variant="error">
			<FontAwesomeIcon icon={faTrash} />
			{$t$('wallet.deleteWallet')}
		</Button>
	</div>
</Modal>

<style>
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

	.wallet-info {
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.5rem;
		font-size: 0.9rem;
	}

	.wallet-info strong {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-color-2);
	}

	.wallet-info code {
		font-family: monospace;
		word-break: break-all;
		color: var(--text-color-1);
	}

	.button-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}
</style>
