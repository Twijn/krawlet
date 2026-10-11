<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import { masterPasswordStore } from '$lib/stores/masterPassword';
	import { t$ } from '$lib/i18n';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';

	const { promptForPassword, error } = masterPasswordStore;

	let masterPassword = $state('');
	let persistPassword = $state(true);

	const onSubmit = async () => {
		await masterPasswordStore.set(masterPassword, persistPassword);
		masterPassword = '';
		persistPassword = true;
	};

	const handleClose = () => {
		masterPasswordStore.cancel();
		masterPassword = '';
	};

	const clearError = () => {
		masterPasswordStore.clearError();
	};
</script>

<Modal bind:open={$promptForPassword} tt="wallet.masterPassword" {onSubmit} onClose={handleClose}>
	<p class="description">
		{$t$('wallet.masterPasswordDescription')}
	</p>

	<label>
		{$t$('wallet.masterPassword')}
		<input type="password" bind:value={masterPassword} oninput={clearError} />
	</label>
	{#if $error}
		<p class="error">{$error}</p>
	{/if}

	<ToggleCheckbox bind:checked={persistPassword}>
		{$t$('wallet.rememberPassword')}
	</ToggleCheckbox>
</Modal>

<style>
	.description {
		color: var(--text-color-2);
		margin: 0;
	}

	.error {
		color: rgb(var(--red));
		margin: 0;
	}
</style>
