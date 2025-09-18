<script lang="ts">
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import type { Address, APIError } from 'kromer';
	import kromer from '$lib/api/kromer';
	import settings from '$lib/stores/settings';

	let {
		privatekey = $bindable(),
		address = $bindable(),
		loading = $bindable(),
		addClearHandler
	}: {
		privatekey: string;
		address: Address | null;
		loading: boolean;
		addClearHandler: (handler: () => void) => void;
	} = $props();

	let masterPassword: string = $state('');
	let selected: string = $state('');

	let options = $derived(
		$settings.wallets.map((x) => {
			return {
				id: x.address,
				name: `${x.name} (${x.address})`
			};
		})
	);

	addClearHandler(() => {
		selected = '';
	});

	let errorMessage: string | null = $state(null);
	async function checkWallet() {
		const wallet = $settings.wallets.find((x) => x.address === selected);
		if (!wallet) return;

		privatekey = (await settings.decryptWallet(wallet, masterPassword)) ?? '';

		if (!privatekey) {
			errorMessage = 'Invalid master password!';
			return;
		}

		loading = true;

		try {
			const response = await kromer.login(privatekey);
			if (response?.address) {
				errorMessage = null;
				address = await kromer.addresses.get(response.address);
			} else {
				errorMessage = 'Failed to login!';
			}
		} catch (e) {
			const err = e as APIError;
			errorMessage = err.message ?? 'Unknown Error';
		}

		loading = false;
	}
</script>

<small class="center"><a href="/wallets">Click here to manage your wallets</a></small>

{#if options.length > 0}
	<label>
		Master Password
		<input type="password" bind:value={masterPassword} onkeyup={checkWallet} />
	</label>
	<ButtonSelect vertical={true} bind:options bind:selected change={checkWallet} />
{:else}
	<Alert variant="danger">
		<strong>You don't have any wallets saved!</strong>
		<p>Click above to add a wallet!</p>
	</Alert>
{/if}
{#if errorMessage}
	<small class="fail">{errorMessage}</small>
{/if}

<style>
	.center {
		display: block;
		text-align: center;
	}
</style>
