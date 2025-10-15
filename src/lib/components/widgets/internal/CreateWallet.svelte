<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { prompt } from '$lib/stores/prompt';
	import { confirm } from '$lib/stores/confirm';
	import { faWallet } from '@fortawesome/free-solid-svg-icons';
	import kromer from '$lib/api/kromer';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import settings from '$lib/stores/settings';
	import { paramState } from '$lib/paramState.svelte';
	import { getSyncNode } from '$lib/consts';
	import type { APIError } from 'kromer';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = null,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let loading = $state(false);
	let kromerKey = $state(getSyncNode().internalKey ?? '');

	let uuid = paramState('uuid', '', {
		shouldSet: (value) => value.length === 36
	});
	let name = paramState('name', '', {
		shouldSet: (value) => value.length > 0
	});
	let saveAsWallet = $state(true);

	let isUUIDValid = $derived(uuid.value.length === 36);
	let isNameValid = $derived(name.value.length > 0);

	function confirmCreate(masterPassword?: string) {
		confirm.confirm({
			message: `Are you sure you want to create the wallet ${name.value} (${uuid.value})?`,
			confirmButtonLabel: 'Create Wallet',
			confirm: () => {
				loading = true;
				kromer.external.createWallet(kromerKey, uuid.value, name.value).then(
					(wallet) => {
						notifications.success(`Wallet ${wallet.address} created successfully!`);
						if (masterPassword) {
							settings
								.addWallet(
									{
										name: `${name.value} - ${uuid.value.split('-')[0]}`,
										address: wallet.address,
										private: wallet.privatekey
									},
									masterPassword
								)
								.then(
									(wallet) => {
										notifications.success(`Wallet ${wallet.name} saved successfully!`);
									},
									(e) => {
										const error = e as APIError;
										notifications.error(error.message ?? 'Unknown Error!');
									}
								);
						}

						navigator.clipboard.writeText(wallet.privatekey).then(
							() => {
								notifications.success('Private key copied to clipboard!');
							},
							(e) => {
								console.error(e);
								notifications.error('Failed to copy private key to clipboard!');
							}
						);

						loading = false;
					},
					(e) => {
						notifications.error(e.message);
						loading = false;
					}
				);
			}
		});
	}

	function createWallet(e: Event) {
		e.preventDefault();

		if (!isUUIDValid) {
			notifications.warning('You must enter a valid UUID.');
			return;
		} else if (!isNameValid) {
			notifications.warning('You must enter a valid name.');
			return;
		}

		if (saveAsWallet) {
			prompt.prompt({
				type: 'password',
				message: "Enter your master password to save the wallet you're creating",
				inputLabel: 'Master Password',
				confirmButtonLabel: 'Save',
				confirm: (value) => {
					confirmCreate(value);
				},
				validate: async (value) => {
					if (!(await settings.validateMasterPassword(value))) {
						return ['Invalid master password'];
					}
					return [];
				}
			});
		} else {
			confirmCreate();
		}
		return false;
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faWallet} /> Create Wallet</h2>
	<form method="POST">
		<ModuleLoading {loading} absolute />

		{#if !getSyncNode().internalKey}
			<label>
				Internal Key
				<input type="text" bind:value={kromerKey} />
			</label>
		{/if}

		<label>
			UUID
			<input
				type="text"
				bind:value={uuid.value}
				placeholder="00000000-0000-0000-0000-000000000000"
			/>
			{#if !isUUIDValid && uuid.value.length > 0}
				<small class="fail">UUID is invalid!</small>
			{/if}
			<button type="button" class="link" onclick={() => (uuid.value = crypto.randomUUID())}>
				Generate random UUID
			</button>
		</label>

		<label>
			Name
			<input type="text" bind:value={name.value} placeholder="Twijn" />
		</label>

		<ToggleCheckbox bind:checked={saveAsWallet}>Save in Krawlet as a wallet</ToggleCheckbox>
		<small>If unselected, the private key will only be copied to your clipboard.</small>

		<div class="buttons">
			<Button variant="primary" type="submit" full={true} onClick={createWallet}
				>Create Wallet</Button
			>
		</div>
	</form>
</Section>

<style>
	form {
		position: relative;
	}

	.buttons {
		margin-top: 1em;
	}
</style>
