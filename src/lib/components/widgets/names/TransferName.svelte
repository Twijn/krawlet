<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSignature } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import AddressSelector from '$lib/components/widgets/addresses/AddressSelector.svelte';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import kromer from '$lib/api/kromer';
	import { notifications } from '$lib/stores/notifications';

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
	let privateKey = $state('');

	let allNames: { id: string; name: string }[] = $state([]);
	let selectedName = $state('');

	$effect(() => {
		if (privateKey === '') {
			allNames = [];
			return;
		}

		const address = kromer.addresses.decodeAddressFromPrivateKey(privateKey);
		kromer.addresses.getNames(address).then(
			(names) => {
				allNames = names.names.map((n) => ({ id: n.name, name: n.name }));
			},
			(e) => {
				console.error(e);
				allNames = [];
				notifications.error(`Failed to retrieve names for address ${address}`);
			}
		);
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faSignature} /> Purchase Name</h2>
	<form method="POST">
		<ModuleLoading {loading} absolute={true} />
		<AddressSelector mode="privatekey" label="Address" bind:privatekey={privateKey} />
		<label>
			Name
			<ButtonSelect vertical bind:options={allNames} bind:selected={selectedName} />
		</label>
		<Button variant="primary" type="submit" full={true}>Transfer Name</Button>
	</form>
</Section>

<style>
	form {
		position: relative;
	}
</style>
