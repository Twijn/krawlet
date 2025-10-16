<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import kromer from '$lib/api/kromer';
	import { paramState } from '$lib/paramState.svelte';
	import { formatCurrency } from '$lib/util';
	import AddressSelector from '$lib/components/widgets/addresses/AddressSelector.svelte';
	import { getSyncNode } from '$lib/consts';

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
	let kromerKey = $state(getSyncNode().internalKey ?? '');

	let address = paramState('address', '', {
		shouldSet: (value) => value.length === 10
	});
	let amount = paramState('amount', 0, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => !isNaN(value) && value > 0
	});

	let isAddressValid = $derived(address.value.length === 10);
	let isAmountValid = $derived(!isNaN(amount.value) && amount.value > 0);

	function giveMoney(e: Event) {
		e.preventDefault();

		if (!isAddressValid) {
			notifications.warning('You must enter a valid address.');
			return;
		} else if (!isAmountValid) {
			notifications.warning('You must enter a valid amount.');
			return;
		}

		confirm.confirm({
			message: `Are you sure you want to give ${formatCurrency(amount.value)} KRO to ${address.value}?`,
			confirmButtonLabel: 'Send',
			confirm: () => {
				kromer.external.giveMoney(kromerKey, address.value, amount.value).then((wallet) => {
					balances[wallet.address] = wallet.balance;
					notifications.success(
						`Successfully sent ${formatCurrency(amount.value)} KRO to ${wallet.address}. New balance: ${formatCurrency(wallet.balance)} KRO`
					);
				});
			}
		});
		return false;
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faPaperPlane} /> Give Money</h2>
	<form method="POST">
		<ModuleLoading {loading} absolute />

		{#if !getSyncNode().internalKey}
			<label>
				Internal Key
				<input type="text" bind:value={kromerKey} />
			</label>
		{/if}

		<AddressSelector label="Recipient" bind:address={address.value} {balances} />

		<label>
			Amount
			<input type="number" bind:value={amount.value} min=".01" step=".01" />
		</label>

		<div class="buttons">
			<Button variant="primary" type="submit" full={true} onClick={giveMoney}>Give Money</Button>
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
