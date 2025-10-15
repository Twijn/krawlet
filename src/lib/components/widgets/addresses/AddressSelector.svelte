<script lang="ts">
	import playerWallets, { type Player } from '$lib/stores/playerWallets';
	import knownAddresses, { type KnownAddress } from '$lib/stores/knownAddresses';
	import type { Wallet } from '$lib/stores/settings';
	import settings from '$lib/stores/settings';
	import AddressComp from './Address.svelte';
	import { formatCurrency } from '$lib/util';
	import kromer from '$lib/api/kromer';
	import ModuleLoading from '../other/ModuleLoading.svelte';
	import {
		faBuilding,
		faCheck,
		faDice,
		faPencil,
		faStore,
		faWallet,
		type IconDefinition
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { Address } from 'kromer';
	import { notifications } from '$lib/stores/notifications';
	import { prompt } from '$lib/stores/prompt';
	import { onMount } from 'svelte';
	import { getSyncNode } from '$lib/consts';

	const NAME_REGEX = /^(\w+@)?(\w+)\.kro$/;
	const ADDRESS_REGEX = /k[a-z0-9]{9}/;

	const PER_FILTER_LIMIT = 5;

	let {
		label,
		mode = 'address',
		query = $bindable(''),
		privatekey = $bindable(),
		address = $bindable(''),
		balances = $bindable({})
	}: {
		label: string;
		mode?: 'address' | 'privatekey';
		query?: string;
		privatekey?: string;
		address?: string;
		balances?: Record<string, number>;
	} = $props();

	type Addr = Wallet | Player | KnownAddress;

	let allAddresses: Addr[] = $derived([
		...$settings.wallets.filter((x) => x.syncNode === getSyncNode().id),
		...$playerWallets.data,
		...$knownAddresses.data
	]);

	let loading: boolean = $state(false);

	let selected: Addr | Address | null = $state(null);

	let balance: number | null = $derived(selected ? (balances[getAddress(selected)] ?? null) : null);

	let filteredAddresses: Addr[] = $derived(
		allAddresses.filter((addr) => {
			const q = query.toLowerCase();
			const address = 'address' in addr ? addr.address : addr.kromerAddress;
			if ('name' in addr && addr.name.toLowerCase().includes(q)) {
				return true;
			} else if (address.toLowerCase().includes(q)) {
				return true;
			} else if ('minecraftName' in addr && addr.minecraftName.toLowerCase().includes(q)) {
				return true;
			}
			return false;
		})
	);

	let filteredWallets: Wallet[] = $derived(
		filteredAddresses.filter((a) => 'private' in a).slice(0, PER_FILTER_LIMIT)
	);
	let filteredPlayers: Player[] = $derived(
		filteredAddresses.filter((a) => 'minecraftUUID' in a).slice(0, PER_FILTER_LIMIT)
	);
	let filteredKnown: KnownAddress[] = $derived(
		filteredAddresses.filter((a) => 'id' in a).slice(0, PER_FILTER_LIMIT)
	);

	function getAddress(addr: Addr | Address): string {
		return 'address' in addr ? addr.address : addr.kromerAddress;
	}

	function clear() {
		selected = null;
		address = '';
		exactResult = null;
		privatekey = '';
	}

	function setAddress(addr: Addr | Address, setQuery: boolean = true) {
		if (mode === 'privatekey' && 'private' in addr) {
			prompt.prompt({
				type: 'password',
				message: 'Enter your master password to decrypt your private keys.',
				inputLabel: 'Master Password',
				confirmButtonLabel: 'Authorize',
				cancelButtonLabel: 'Cancel',
				validate: async (value) => {
					try {
						if (await settings.decryptWallet(addr, value)) {
							return [];
						}
						return ['Invalid master password!'];
					} catch (e) {
						console.error(e);
						return ['An unknown error occurred!'];
					}
				},
				confirm: async (value) => {
					const decrypted = await settings.decryptWallet(addr, value);
					if (decrypted) {
						privatekey = decrypted;
						selected = addr;
						address = getAddress(addr);
						if (setQuery) {
							query = address;
						}
					}
				},
				cancel: clear
			});
		} else {
			selected = addr;
			address = getAddress(addr);
			if (setQuery) {
				query = address;
			}
		}
	}

	let exactResult: string | null = $state(null);

	function updateExact() {
		if (mode === 'address') {
			const nameMatch = query.match(NAME_REGEX);
			if (nameMatch && nameMatch[2]) {
				const nameStr = nameMatch[2];
				kromer.names.get(nameStr).then(
					(name) => {
						kromer.addresses.get(name.owner).then(
							(addr) => {
								exactResult = addr.address;
								setAddress(addr, false);
							},
							(e) => {
								notifications.warning(`Failed to fetch address for name ${nameStr}!`);
								console.error(e);
							}
						);
					},
					(e) => {
						notifications.warning(`Failed to fetch name ${nameStr}!`);
						console.error(e);
					}
				);
			} else if (ADDRESS_REGEX.test(query)) {
				kromer.addresses.get(query).then(
					(addr) => {
						exactResult = addr.address;
						setAddress(addr, false);
					},
					(e) => {
						notifications.warning(`Failed to fetch address ${query}!`);
						console.error(e);
					}
				);
			}
		} else if (mode === 'privatekey' && query.length > 7) {
			exactResult = kromer.addresses.decodeAddressFromPrivateKey(query);
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (filteredAddresses.length === 1) {
				setAddress(filteredAddresses[0]);
			} else if (mode === 'privatekey' && exactResult) {
				privateKeyExactResult(query);
			}
		} else if (query !== address) {
			if (
				mode === 'privatekey' &&
				kromer.addresses.decodeAddressFromPrivateKey(query) === exactResult
			) {
				return;
			}
			clear();
		}

		updateExact();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
		}
	}

	onMount(() => {
		updateExact();
	});

	$effect(() => {
		if (loading) return;
		const addresses = [
			...filteredWallets.map((x) => x.address),
			...filteredPlayers.map((x) => x.kromerAddress),
			...filteredKnown.map((x) => x.address)
		].filter((x) => !Object.prototype.hasOwnProperty.call(balances, x));

		if (mode === 'address') {
			if (exactResult && typeof balances[exactResult] !== 'number') {
				addresses.push(exactResult);
			}
		}

		if (addresses.length > 0) {
			loading = true;
			kromer.addresses.getMultiple(addresses).then((addrs) => {
				// Initially set all retrieve balances to 0, then update with actual balances
				// This prevents unknown addresses from being continuously fetched
				for (const addr of addresses) {
					balances[addr] = 0;
				}

				for (const [address, addressObj] of Object.entries(addrs)) {
					balances[address] = addressObj.balance;
				}
				loading = false;
			});
		}
	});

	async function privateKeyExactResult(privateKey: string) {
		const response = await kromer.login(privateKey);
		if (response.address) {
			const address = await kromer.addresses.get(response.address);
			balances[address.address] = address.balance;
			privatekey = privateKey;
			setAddress(address, false);
		} else {
			notifications.warning('Invalid private key!');
		}
	}

	function getVerifiedIcon(addr: KnownAddress): IconDefinition | null {
		switch (addr.type) {
			case 'shop':
				return faStore;
			case 'gamble':
				return faDice;
			case 'company':
				return faBuilding;
			default:
				return faCheck;
		}
	}
</script>

<div
	class="address-selector"
	class:hidden={address && !filteredAddresses.find((x) => getAddress(x) !== address)}
>
	<ModuleLoading bind:loading absolute={true} />
	<label>
		{label}
		<input
			type={mode === 'privatekey' && exactResult && filteredAddresses.length === 0
				? 'password'
				: 'text'}
			name="query-{label.toLowerCase()}"
			placeholder="Search for addresses..."
			bind:value={query}
			onkeyup={handleKeyUp}
			onkeydown={handleKeyDown}
		/>
	</label>
	{#if selected}
		{@const type =
			'private' in selected ? 'wallet' : 'type' in selected ? selected.type : 'address'}
		{@const address = getAddress(selected)}
		<div class="detail">
			<div class="selected">
				<strong class="caps">{type}:</strong>
				<AddressComp {address} />
			</div>
			{#if typeof balance === 'number'}
				<span class="balance">{formatCurrency(balance)} <small>KRO</small></span>
			{/if}
		</div>
	{/if}
	<ul class="dropdown">
		{#if filteredWallets.length > 0}
			<li><strong>Wallets</strong></li>
			{#each filteredWallets as addr (addr.name + '.' + addr.address)}
				{@const address = getAddress(addr)}
				<li>
					<button type="button" onclick={() => setAddress(addr)}>
						<FontAwesomeIcon icon={faWallet} />
						<span class="bold-500">{addr.name}</span>
						<small>({address})</small>
						{#if typeof balances[address] === 'number'}
							<span class="right">{formatCurrency(balances[address])} <small>KRO</small></span>
						{/if}
					</button>
				</li>
			{/each}
		{:else if mode === 'privatekey' && !exactResult && !allAddresses.find((x) => 'private' in x)}
			<li>
				<a href="/wallets">
					You don't have any wallets saved!
					<br /><br />
					Click here to add a new one, or enter a private key above to use it once.
				</a>
			</li>
		{/if}
		{#if mode === 'address'}
			{#if filteredPlayers.length > 0}
				<li><strong>Players</strong></li>
				{#each filteredPlayers as addr (addr.kromerAddress)}
					{@const address = getAddress(addr)}
					<li>
						<button type="button" onclick={() => setAddress(addr)}>
							<img
								src="https://api.mineatar.io/face/{addr.minecraftUUID}"
								alt="Avatar for {addr.minecraftName}"
							/>
							<span class="bold-500">{addr.minecraftName}</span>
							<small>({address})</small>
							{#if typeof balances[address] === 'number'}
								<span class="right">{formatCurrency(balances[address])} <small>KRO</small></span>
							{/if}
						</button>
					</li>
				{/each}
			{/if}
			{#if filteredKnown.length > 0}
				<li><strong>Shops &amp; Verified</strong></li>
				{#each filteredKnown as addr (addr.address)}
					{@const address = getAddress(addr)}
					{@const icon = getVerifiedIcon(addr)}
					<li>
						<button type="button" onclick={() => setAddress(addr)}>
							{#if 'imageSrc' in addr && addr.imageSrc}
								<img src={addr.imageSrc} alt="Icon for {addr.name}" />
							{:else if icon}
								<FontAwesomeIcon {icon} />
							{/if}
							<span class="bold-500">{addr.name}</span>
							<small>({address})</small>
							{#if typeof balances[address] === 'number'}
								<span class="right">{formatCurrency(balances[address])} <small>KRO</small></span>
							{/if}
						</button>
					</li>
				{/each}
			{/if}
		{:else if mode === 'privatekey' && exactResult}
			<li><strong>Exact Result</strong></li>
			<li>
				<button type="button" onclick={() => privateKeyExactResult(query)}>
					<FontAwesomeIcon icon={faPencil} />
					<span class="bold-500">{exactResult}</span>
				</button>
			</li>
		{/if}
	</ul>
</div>

<style>
	.address-selector {
		position: relative;
	}

	.dropdown {
		background-color: var(--background-color-1);
		position: absolute;
		top: calc(100% + 0.5em);
		left: 0;
		width: 100%;
		margin: 0;
		padding: 0;
		list-style-type: none;
		border-radius: 0.25em;
		box-shadow: 2px 2px 16px rgba(0, 0, 0, 0.5);
		z-index: 9999;
		overflow: hidden auto;
		visibility: hidden;
		opacity: 0;
		transform: translateY(-10px) scaleY(0.9);
		transition:
			opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			visibility 0s linear 0.25s;
		max-height: 20em;
		opacity: 0;
		transform: translateY(-10px) scaleY(0.9);
		transition:
			opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.address-selector:not(.hidden):focus-within .dropdown {
		visibility: visible;
		opacity: 1;
		transform: unset; /* FUCK SAFARI */
		transition-delay: 0s;
	}

	.dropdown strong {
		display: block;
		background-color: rgba(0, 0, 0, 0.2);
		color: var(--text-color-2);
		font-size: 0.8em;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.6em 0.5em;
		text-align: center;
	}

	.dropdown button {
		display: flex;
		align-items: center;
		gap: 0.35em;
		width: 100%;
		background-color: transparent;
		border: none;
		font-size: 1rem;
		padding: 0.6em 0.75em;
		cursor: pointer;
		text-align: left;
		transition: 0.25s background-color;
		color: var(--text-color-1);
		-webkit-tap-highlight-color: transparent;
		appearance: none;
		box-shadow: none;
		outline: none;
	}

	.dropdown button img {
		width: 0.8em;
		height: 0.8em;
		border-radius: 0.2em;
	}

	.dropdown button .right {
		flex-grow: 1;
	}

	.dropdown button:hover,
	.dropdown button:focus-visible {
		background-color: rgba(0, 0, 0, 0.2);
	}

	.dropdown button :global(svg) {
		opacity: 0.5;
	}

	.dropdown a {
		display: block;
		color: var(--text-color-2);
		text-decoration: none;
		font-size: 0.8em;
		line-height: 0.9em;
		text-align: center;
		padding: 0.6em 0.75em;
	}

	.detail {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>
