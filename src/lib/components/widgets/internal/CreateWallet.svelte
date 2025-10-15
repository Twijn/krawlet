<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import AddressSelector from '$lib/components/widgets/addresses/AddressSelector.svelte';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import { notifications } from '$lib/stores/notifications';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import { confirm } from '$lib/stores/confirm';
	import { faUpDownLeftRight } from '@fortawesome/free-solid-svg-icons';
	import { SYNC_NODE } from '$lib/consts';

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
	let kromerKey = $state(SYNC_NODE.internalKey ?? '');
	let uuid = $state('');
	let name = $state('');

	let isUUIDValid = $derived(uuid.length === 36);
	let isNameValid = $derived(name.length > 0);

	function createWallet(e: Event) {
		e.preventDefault();

		if (!isUUIDValid) {
			notifications.warning('You must enter a valid UUID.');
			return;
		} else if (!isNameValid) {
			notifications.warning('You must enter a valid name.');
			return;
		}

		confirm.confirm({
			message: `Are you sure you want to create the wallet ${name} with UUID ${uuid}?`,
			confirmButtonLabel: 'Create Wallet',
			danger: true,
			confirm: () => {
				loading = true;

			}
		});
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faUpDownLeftRight} /> Transfer Name</h2>
	<form method="POST">
		<ModuleLoading {loading} absolute />

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
