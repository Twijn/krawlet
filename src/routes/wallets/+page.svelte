<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { faPlus } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import Button from '$lib/components/Button.svelte';
	import kromer from '$lib/api/kromer';
	import { walletStore } from '$lib/walletStore';
	import Wallets from '$lib/components/Wallets.svelte';
	import type { APIError } from 'kromer';
	import Alert from '$lib/components/Alert.svelte';
	import Import from '$lib/components/importexport/Import.svelte';
	import Export from '$lib/components/importexport/Export.svelte';

	let masterPassword = $state('');
	let name = $state('');
	let pkey = $state('');
	let decodedAddress = $derived(
		pkey.length === 0 ? '' : kromer.addresses.decodeAddressFromPrivateKey(pkey)
	);

	async function addWallet(e: Event) {
		e.preventDefault();

		if (masterPassword.length < 8) {
			alert('Your master password must be at least 8 characters!');
			return false;
		}

		try {
			await walletStore.addWallet(
				{
					name,
					address: kromer.addresses.decodeAddressFromPrivateKey(pkey),
					private: pkey
				},
				masterPassword
			);

			name = '';
			pkey = '';
		} catch (e) {
			const err = e as APIError;
			alert(err.message ?? 'Unknown Error!');
		}

		return false;
	}
</script>

<svelte:head>
	<title>Wallets | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/wallets">Wallets</a>
</h1>

<Wallets lgCols={8} mdCols={12} showDelete={true} />
<Section lgCols={4} mdCols={12}>
	<h2><FontAwesomeIcon icon={faPlus} /> New Wallet</h2>
	<form method="POST">
		<label>
			Master Password
			<input id="new" type="password" name="masterPassword" bind:value={masterPassword} />
			<small
				>{#if $walletStore.wallets.length > 0}You must use the same password as your past wallets!{/if}
				Make sure you keep this safe!</small
			>
		</label>
		<label>
			Name
			<input type="text" name="name" bind:value={name} />
			<small>Give your wallet a good name that you'll recognize!</small>
		</label>
		<label>
			Private Key
			<input type="password" name="pkey" bind:value={pkey} />
			<small>This private key will be encrypted in your local storage.</small>
		</label>
		{#if decodedAddress.length === 10}
			<p>
				<strong>Decoded Address:</strong>
				{decodedAddress}
			</p>
		{/if}
		<Button type="submit" full={true} onClick={addWallet}>Add Wallet</Button>
	</form>
</Section>

<Import lgCols={6} smCols={12} />
<Export lgCols={6} smCols={12} />

<div class="col-12">
	<Alert variant="danger">
		<strong>Warning!</strong>
		<p>Wallets are still in beta! Make sure you back up your keys elsewhere!</p>
	</Alert>
</div>
