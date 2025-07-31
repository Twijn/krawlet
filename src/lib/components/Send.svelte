<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
	import kromer from '$lib/api/kromer';
	import type { Address } from '$lib/api/types/Address';
	import ModuleLoading from '$lib/components/ModuleLoading.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { APIError } from '$lib/api/types/APIError';
	import type { MakeTransactionBody } from '$lib/api/types/MakeTransaction';
	import ButtonSelect from '$lib/components/ButtonSelect.svelte';
	import {slide} from 'svelte/transition';
	import type { MapPlayer, PlayersResponse } from '$lib/extendedAPI';
	import { onMount } from 'svelte';
	import Alert from '$lib/components/Alert.svelte';

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

	let loading: boolean = $state(false);

	// Private key authentication
	let privatekey: string = $state('');
	let authFailed: boolean = $state(false);
	let address: Address | null = $state(null);

	const verifyKey = async () => {
		authFailed = false;
		address = null;
		if (privatekey.length < 8) return;
		loading = true;
		const response = await kromer.login(privatekey);
		if (response.ok && response.authed && response.address) {
			address = await kromer.address({
				address: response.address
			});
		} else {
			authFailed = true;
		}
		loading = false;
	};

	const toOptions = [
		{
			id: "address",
			name: "Address / Name",
		},
		{
			id: "minecraft",
			name: "Minecraft User",
		},
	];
	let toType: string = $state("address");

	let toPlayer: string = $state("");
	let onlinePlayers: MapPlayer[] = $state([]);
	let selectedPlayer: MapPlayer | null = $derived(onlinePlayers.find(x => x.uuid === toPlayer) ?? null);

	async function getPlayers() {
		const response: PlayersResponse = await (await fetch("/api/players")).json() as PlayersResponse;
		if (response.ok) {
			onlinePlayers = response.players;
		} else {
			console.error(response);
		}
	}

	onMount(async () => {
		await getPlayers();

		setInterval(getPlayers, 60_000);
	});

	// "To" address authentication
	let to = $state('');
	let toAddress: Address | null = $state(null);
	let toAddressError: string | null = $state(null);

	$effect(() => {
		if (selectedPlayer?.address) {
			toAddress = selectedPlayer.address;
		}
	})

	const verifyTo = async () => {
		loading = true;
		try {
			toAddress = await kromer.resolve(to);
			toAddressError = null;
		} catch (e) {
			toAddress = null;
			const err = e as APIError;
			toAddressError = err?.message ?? 'An unknown error occurred.';
		}
		loading = false;
	};

	const clearTo = () => {
		toPlayer = "";
		toAddress = null;
		toAddressError = null;
		to = "";
	}

	// Metadata
	let metadata: string = $state('');

	// Amount & sending
	let amount: number = $state(0);

	const send = async (e: Event) => {
		e.preventDefault();
		if (
			confirm(`Are you sure you want to send ${amount.toFixed(2)} KRO to ${toAddress?.address}?`)
		) {
			if (!address) {
				alert('Invalid private key!');
				return false;
			} else if (!toAddress) {
				alert('Invalid recipient!');
				return false;
			} else if (amount > address.balance) {
				alert("You don't have enough money to send that amount!");
				return false;
			} else if (amount <= 0) {
				alert('Nice try!');
				return false;
			} else {
				loading = true;
				try {
					const data: MakeTransactionBody = {
						privatekey,
						to: toAddress?.address,
						amount
					};

					if (metadata && metadata.length > 0) {
						data.metadata = metadata;
					}

					await kromer.send(data);

					alert('Transaction successful!');
				} catch (e) {
					const err = e as APIError;
					alert(err.message);
				}
				loading = false;
			}
		}
		return false;
	};
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faPaperPlane} /> Send Kromer</h2>
	<form method="POST">
		<ModuleLoading absolute={true} {loading} />
		<label>
			Private Key
			<input type="password" bind:value={privatekey} onblur={verifyKey} />
			{#if address}
				{#if address.balance > 0}
					<small class="success"
						>Authentication successful! Logged in as {address.address} with {address.balance.toFixed(
							2
						)} KRO</small
					>
				{:else}
					<small class="fail"
						>Authentication was successful, but {address.address} has no money!</small
					>
				{/if}
			{:else if authFailed}
				<small class="fail">Authentication failed!</small>
			{:else}
				<small
					>Unfocus from the field above to verify your key. Key must have at least 8 characters.</small
				>
			{/if}
		</label>
		<ButtonSelect vertical={false} options={toOptions} bind:selected={toType} change={clearTo} />
		{#if toType === "address"}
			<label transition:slide>
				To Address / Name
				<input type="text" bind:value={to} placeholder="ks0d5iqb6p" onblur={verifyTo} />
				{#if toAddress}
					<small class="success">{toAddress.address} has {toAddress.balance} KRO</small>
				{:else if toAddressError}
					<small class="fail">{toAddressError}</small>
				{:else}
					<small>Unfocus from the field above to verify the "to" address.</small>
				{/if}
			</label>
		{:else}
			<div transition:slide>
				{#if onlinePlayers.length > 0}
					Select Player
					<ButtonSelect vertical={true} options={onlinePlayers.map(x => { return {id: x.uuid, name: x.name}})} bind:selected={toPlayer} />
					{#if toAddress && selectedPlayer?.address}
						<small class="success">{selectedPlayer.name} has {toAddress.balance} KRO</small>
					{/if}
				{:else}
					<Alert variant="danger">
						<strong>No players are currently online!</strong>
						<p>Due to Kromer's limitations, users must be online to send them Kromer.</p>
					</Alert>
				{/if}
			</div>
		{/if}
		<label>
			Amount
			<input type="number" min="0" max={address?.balance ?? 0} step="0.01" bind:value={amount} />
		</label>
		<label>
			Metadata
			<input type="text" bind:value={metadata} />
		</label>
		<Button
			type="submit"
			full={true}
			disabled={!address || !toAddress || amount === 0}
			onClick={send}
		>
			Send
			{#if amount > 0}
				{amount.toFixed(2)} KRO
			{/if}
		</Button>
	</form>
</Section>

<Alert variant="info">
	<strong>Information</strong>
	<p>
		Due to Kromer API limitations you may only select players that are online.
	</p>
</Alert>

<style>
	form {
		position: relative;
	}

	.success {
		color: rgb(var(--green));
	}

	.fail {
		color: rgb(var(--red));
	}
</style>
