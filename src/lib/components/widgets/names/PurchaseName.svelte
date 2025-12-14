<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSignature } from '@fortawesome/free-solid-svg-icons';
	import type { APIError } from 'kromer';
	import kromer from '$lib/api/kromer';
	import { onMount } from 'svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import AddressSelector from '$lib/components/widgets/addresses/AddressSelector.svelte';
	import { t$ } from '$lib/i18n';

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

	let nameCost = $state(500);
	onMount(async () => {
		nameCost = await kromer.names.getCost();
	});

	let name = $state('');
	let showNameStatus = $state(false);
	let nameAvailable = $state(false);

	function checkName() {
		if (name.length > 0) {
			loading = true;
			kromer.names.check(name).then((available) => {
				nameAvailable = available;
				showNameStatus = true;
				loading = false;
			});
		}
	}

	function buyName(e: Event) {
		e.preventDefault();

		if (!nameAvailable) {
			notifications.error($t$('name.nameNotAvailable', { name }));
			return false;
		}

		confirm.confirm({
			message: $t$('name.confirmPurchase', { name, cost: nameCost }),
			confirmButtonLabel: $t$('name.purchaseButton'),
			confirm: () => {
				kromer.names
					.register(name, {
						privatekey: privateKey
					})
					.then(
						async () => {
							notifications.success($t$('name.purchaseSuccess'));
							name = '';
							showNameStatus = false;
						},
						(e) => {
							const err = e as APIError;
							notifications.error(
								$t$('name.purchaseFailed', { message: err.message || 'Unknown error' })
							);
						}
					);
			},
			cancel: () => {
				notifications.warning($t$('name.purchaseCancelled'));
			}
		});

		return false;
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faSignature} /> {$t$('name.purchaseName')}</h2>
	<form method="POST">
		<ModuleLoading {loading} absolute={true} />
		<AddressSelector
			mode="privatekey"
			label={$t$('address.address')}
			bind:privatekey={privateKey}
		/>
		<label>
			{$t$('name.name')}
			<input
				type="text"
				name="name"
				placeholder={$t$('name.namePlaceholder')}
				bind:value={name}
				onblur={checkName}
				onkeyup={() => (showNameStatus = false)}
			/>
			{#if showNameStatus}
				{#if nameAvailable}
					<small class="success">{$t$('name.nameAvailable', { name })}</small>
				{:else}
					<small class="fail">{$t$('name.nameNotAvailable', { name })}</small>
				{/if}
			{:else}
				<small>{$t$('name.checkNameHint')}</small>
			{/if}
		</label>
		<Button
			variant="primary"
			type="submit"
			disabled={!privateKey || !nameAvailable}
			onClick={buyName}
			full={true}
		>
			{$t$('name.purchaseButton')}
		</Button>
	</form>
</Section>

<style>
	form {
		position: relative;
	}
</style>
