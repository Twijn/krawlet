<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import AddressSelector from '$lib/components/widgets/addresses/AddressSelector.svelte';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import kromer from '$lib/api/kromer';
	import { notifications } from '$lib/stores/notifications';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import { confirm } from '$lib/stores/confirm';
	import type { APIError } from 'kromer';
	import { faUpDownLeftRight } from '@fortawesome/free-solid-svg-icons';

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

	let balances: Record<string, number> = $state({});

	let loading = $state(false);
	let privatekey = $state('');
	let address = $state('');

	let allNames: { id: string; name: string }[] = $state([]);
	let selectedName = $state('');

	function updateNames() {
		loading = true;
		const address = kromer.addresses.decodeAddressFromPrivateKey(privatekey);
		kromer.addresses.getNames(address).then(
			(names) => {
				allNames = names.names.map((n) => ({ id: n.name, name: n.name + '.kro' }));
				loading = false;
			},
			(e) => {
				console.error(e);
				allNames = [];
				notifications.error(`Failed to retrieve names for address ${address}`);
				loading = false;
			}
		);
	}

	$effect(() => {
		if (privatekey === '') {
			allNames = [];
			return;
		}

		updateNames();
	});

	function transferName(e: Event) {
		e.preventDefault();

		if (selectedName.length === 0) {
			notifications.warning('You must select a name to transfer.');
			return;
		} else if (address.length !== 10) {
			notifications.warning('You must enter a valid address.');
			return;
		}

		confirm.confirm({
			message: `Are you sure you want to transfer the name ${selectedName} to ${address}?`,
			confirmButtonLabel: 'Transfer Name',
			danger: true,
			confirm: () => {
				loading = true;
				kromer.names
					.transfer(selectedName, {
						privatekey,
						address
					})
					.then(
						async () => {
							notifications.success('Name transferred successfully!');
							selectedName = '';
							updateNames();
							loading = false;
						},
						(e) => {
							const err = e as APIError;
							notifications.error(`Failed to transfer name: ${err.message}`);
							loading = false;
						}
					);
			}
		});
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faUpDownLeftRight} /> Transfer Name</h2>
	<form method="POST">
		<ModuleLoading {loading} absolute />
		<Alert variant="danger">
			<strong>DANGER! Read me!</strong>
			<p>
				At this time, this transfers <em>all</em> of the names you own, rather than just the single
				one. <strong>You should probably not use this feature until this is patched.</strong>
			</p>
		</Alert>
		<AddressSelector mode="privatekey" label="Address" bind:privatekey bind:balances />
		<label>
			Name
			{#if allNames.length > 0}
				<ButtonSelect vertical bind:options={allNames} bind:selected={selectedName} />
			{:else if privatekey.length > 0 || loading}
				<Alert variant="danger">This address doesn't own any names!</Alert>
			{:else}
				<Alert variant="info">Select a private key above to see available names.</Alert>
			{/if}
		</label>
		<AddressSelector mode="address" label="Recipient" bind:address bind:balances />
		<div class="buttons">
			<Button variant="primary" type="submit" full={true} onClick={transferName}
				>Transfer Name</Button
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
