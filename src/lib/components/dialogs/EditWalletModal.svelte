<script lang="ts">
	import { editWalletModal } from '$lib/stores/editWalletModal';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { t$ } from '$lib/i18n';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import settings from '$lib/stores/settings';

	let name = $state('');
	let submitting = $state(false);
	let originalWallet = $state($editWalletModal.wallet);

	// Watch for modal open and initialize values
	$effect(() => {
		if ($editWalletModal.open && $editWalletModal.wallet) {
			originalWallet = $editWalletModal.wallet;
			name = $editWalletModal.wallet.name;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!originalWallet) {
			notifications.error($t$('common.error'));
			return false;
		}

		submitting = true;

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
		} finally {
			submitting = false;
		}

		return false;
	}

	function handleClose() {
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
</script>

<Modal open={$editWalletModal.open} title={$t$('wallet.editWallet')} onClose={handleClose}>
	<form method="POST" onsubmit={handleSubmit}>
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

		<div class="modal-buttons">
			<Button type="button" variant="secondary" onClick={handleClose}>
				{$t$('common.cancel')}
			</Button>
			<Button type="submit" variant="primary" disabled={submitting}>
				{submitting ? $t$('common.loading') : $t$('common.save')}
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

	.modal-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
