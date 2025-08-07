<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSignature } from '@fortawesome/free-solid-svg-icons';
	import PrivateKeyInput from '$lib/components/send/PrivateKeyInput.svelte';
	import type { Address, APIError } from 'kromer';
	import kromer from '$lib/api/kromer';
	import { onMount } from 'svelte';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import Button from '$lib/components/Button.svelte';

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
	let privateKeyAddress: Address | null = $state(null);

	let nameCost = $state(3);
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

		if (
			!confirm(
				`Are you sure you want to purchase '${name}.kro' for ${nameCost} KRO? This action cannot be undone!`
			)
		) {
			return false;
		}

		if (!privateKeyAddress || privateKeyAddress.balance < nameCost) {
			alert("You don't have enough money to purchase a name!");
			return false;
		}
		if (!nameAvailable) {
			alert("This name isn't available!");
			return false;
		}
		kromer.names
			.register(name, {
				privatekey: privateKey
			})
			.then(
				async () => {
					alert('Name purchase successful!');
					name = '';
					showNameStatus = false;
				},
				(e) => {
					const err = e as APIError;
					alert(`Failed to purchase name: ${err.message}`);
				}
			);

		return false;
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faSignature} /> Purchase Name</h2>
	<form method="POST">
		<ModuleLoading {loading} absolute={true} />
		<PrivateKeyInput
			bind:loading
			bind:privatekey={privateKey}
			bind:address={privateKeyAddress}
			bind:minimumBalance={nameCost}
		/>
		<label>
			Name
			<input
				type="text"
				name="name"
				placeholder="Don't include .kro at the end!"
				bind:value={name}
				onblur={checkName}
				onkeyup={() => (showNameStatus = false)}
			/>
			{#if showNameStatus}
				{#if nameAvailable}
					<small class="success">{name}.kro is currently available!</small>
				{:else}
					<small class="fail">{name}.kro is not available!</small>
				{/if}
			{:else}
				<small>Unfocus from the field above to check if the name is available.</small>
			{/if}
		</label>
		<Button
			variant="primary"
			type="submit"
			disabled={!privateKey || !nameAvailable}
			onClick={buyName}
			full={true}
		>
			Purchase Name
		</Button>
	</form>
</Section>

<style>
	form {
		position: relative;
	}
</style>
