<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { faPlus } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import Button from '$lib/components/ui/Button.svelte';
	import kromer from '$lib/api/kromer';
	import Wallets from '$lib/components/widgets/Wallets.svelte';
	import type { APIError } from 'kromer';
	import Import from '$lib/components/widgets/importexport/Import.svelte';
	import Export from '$lib/components/widgets/importexport/Export.svelte';
	import { notifications } from '$lib/stores/notifications';
	import settings from '$lib/stores/settings';
	import { getSyncNode } from '$lib/consts';
	import { t$ } from '$lib/i18n';

	let masterPassword = $state('');
	let name = $state('');
	let pkey = $state('');
	let decodedAddress = $derived(
		pkey.length === 0 ? '' : kromer.addresses.decodeAddressFromPrivateKey(pkey)
	);

	async function addWallet(e: Event) {
		e.preventDefault();

		if (masterPassword.length < 8) {
			notifications.error($t$('wallet.masterPasswordMinLength'));
			return false;
		}

		try {
			const address = kromer.addresses.decodeAddressFromPrivateKey(pkey);
			await settings.addWallet(
				{
					name,
					address,
					private: pkey
				},
				masterPassword
			);

			notifications.success($t$('wallet.walletAddSuccess', { name, address }));

			name = '';
			pkey = '';
		} catch (e) {
			const err = e as APIError;
			notifications.error(err.message ?? 'Unknown Error!');
		}

		return false;
	}
</script>

<svelte:head>
	<title>Wallets | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/wallets">{$t$('nav.wallets')}</a>
</h1>

<Wallets lgCols={8} mdCols={12} showDelete={true} />
<Section lgCols={4} mdCols={12}>
	<h2><FontAwesomeIcon icon={faPlus} /> {$t$('wallet.newWallet')}</h2>
	<form method="POST">
		<label>
			{$t$('wallet.masterPassword')}
			<input id="new" type="password" name="masterPassword" bind:value={masterPassword} />
			<small
				>{#if $settings.wallets.filter((x) => x.syncNode === getSyncNode().id).length > 0}{$t$(
						'wallet.masterPasswordSameHint'
					)}{/if}
				{$t$('wallet.masterPasswordHint')}</small
			>
		</label>
		<label>
			{$t$('name.name')}
			<input type="text" name="name" bind:value={name} />
			<small>{$t$('wallet.nameHint')}</small>
		</label>
		<label>
			{$t$('wallet.privateKey')}
			<input type="password" name="pkey" bind:value={pkey} />
			<small>{$t$('wallet.privateKeyHint')}</small>
		</label>
		{#if decodedAddress.length === 10}
			<p>
				<strong>{$t$('wallet.decodedAddress')}:</strong>
				{decodedAddress}
			</p>
		{/if}
		<Button type="submit" full={true} onClick={addWallet}>{$t$('wallet.addWallet')}</Button>
	</form>
</Section>

<Import lgCols={6} mdCols={12} />
<Export lgCols={6} mdCols={12} />
