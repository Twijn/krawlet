<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faWallet,
		faStore,
		faBuilding,
		faDice,
		faCheck,
		faUser
	} from '@fortawesome/free-solid-svg-icons';
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
	import playerWallets, { type Player } from '$lib/stores/playerWallets';
	import knownAddresses, { type KnownAddress } from '$lib/stores/knownAddresses';
	import type { Wallet } from '$lib/stores/settings';
	import settings from '$lib/stores/settings';
	import { getMinecraftAvatar } from '$lib/util';
	import kromer from '$lib/api/kromer';
	import { notifications } from '$lib/stores/notifications';

	const NAME_REGEX = /^(\w+@)?(\w+)\.kro$/;
	const ADDRESS_REGEX = /k[a-z0-9]{9}/;

	type Props = {
		/** Whether the modal is open */
		open?: boolean;
		/** Called when modal is closed */
		onClose: () => void;
		/** Called when an address is selected */
		onSelect: (address: string, label?: string) => void;
		/** Addresses already selected (to show as disabled) */
		selectedAddresses?: string[];
		/** Modal title */
		title?: string;
	};

	let {
		open = $bindable(false),
		onClose,
		onSelect,
		selectedAddresses = [],
		title = 'Add Address Filter'
	}: Props = $props();

	type Addr = Wallet | Player | KnownAddress;

	let query = $state('');
	let loading = $state(false);

	let allAddresses: Addr[] = $derived([
		...$settings.wallets,
		...$playerWallets.data,
		...$knownAddresses.data
	]);

	let filteredAddresses: Addr[] = $derived(
		allAddresses.filter((addr) => {
			const q = query.toLowerCase();
			const address = getAddress(addr);

			// Don't show already selected addresses
			if (selectedAddresses.includes(address)) return false;

			if (!q) return true;

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
		filteredAddresses.filter((a): a is Wallet => 'private' in a).slice(0, 5)
	);
	let filteredPlayers: Player[] = $derived(
		filteredAddresses.filter((a): a is Player => 'minecraftUUID' in a).slice(0, 5)
	);
	let filteredKnown: KnownAddress[] = $derived(
		filteredAddresses
			.filter((a): a is KnownAddress => 'id' in a && !('private' in a) && !('minecraftUUID' in a))
			.slice(0, 5)
	);

	function getAddress(addr: Addr): string {
		return 'address' in addr ? addr.address : addr.kromerAddress;
	}

	function getLabel(addr: Addr): string {
		if ('name' in addr) return addr.name;
		if ('minecraftName' in addr) return addr.minecraftName;
		return getAddress(addr);
	}

	function getVerifiedIcon(addr: KnownAddress): IconDefinition {
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

	function handleSelect(addr: Addr) {
		onSelect(getAddress(addr), getLabel(addr));
		query = '';
		onClose();
	}

	async function handleCustomAddress() {
		if (!query) return;

		loading = true;

		try {
			// Check if it's a name
			const nameMatch = query.match(NAME_REGEX);
			if (nameMatch && nameMatch[2]) {
				const name = await kromer.names.get(nameMatch[2]);
				const addr = await kromer.addresses.get(name.owner);
				onSelect(addr.address, `${nameMatch[2]}.kro`);
				query = '';
				onClose();
				return;
			}

			// Check if it's a raw address
			if (ADDRESS_REGEX.test(query)) {
				const addr = await kromer.addresses.get(query);
				onSelect(addr.address);
				query = '';
				onClose();
				return;
			}

			notifications.warning('Invalid address or name format');
		} catch (e) {
			notifications.error('Failed to verify address');
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (filteredAddresses.length === 1) {
				handleSelect(filteredAddresses[0]);
			} else if (ADDRESS_REGEX.test(query) || NAME_REGEX.test(query)) {
				handleCustomAddress();
			}
		}
	}
</script>

<Modal {open} {title} {onClose}>
	<div class="address-filter-modal">
		<div class="search-input">
			<input
				type="text"
				placeholder="Search addresses, names, or enter custom..."
				bind:value={query}
				onkeydown={handleKeyDown}
			/>
		</div>

		<div class="address-lists">
			{#if filteredWallets.length > 0}
				<div class="address-group">
					<h4>Your Wallets</h4>
					<ul>
						{#each filteredWallets as addr (addr.address)}
							<li>
								<button type="button" onclick={() => handleSelect(addr)}>
									<FontAwesomeIcon icon={faWallet} />
									<span class="name">{addr.name}</span>
									<span class="address">{addr.address}</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if filteredPlayers.length > 0}
				<div class="address-group">
					<h4>Players</h4>
					<ul>
						{#each filteredPlayers as addr (addr.kromerAddress)}
							<li>
								<button type="button" onclick={() => handleSelect(addr)}>
									<img src={getMinecraftAvatar(addr.minecraftUUID)} alt="" class="avatar" />
									<span class="name">{addr.minecraftName}</span>
									<span class="address">{addr.kromerAddress}</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if filteredKnown.length > 0}
				<div class="address-group">
					<h4>Shops & Verified</h4>
					<ul>
						{#each filteredKnown as addr (addr.address)}
							{@const icon = getVerifiedIcon(addr)}
							<li>
								<button type="button" onclick={() => handleSelect(addr)}>
									{#if addr.imageSrc}
										<img src={addr.imageSrc} alt="" class="avatar" />
									{:else}
										<FontAwesomeIcon {icon} />
									{/if}
									<span class="name">{addr.name}</span>
									<span class="address">{addr.address}</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if query && (ADDRESS_REGEX.test(query) || NAME_REGEX.test(query))}
				<div class="address-group custom">
					<h4>Custom Address</h4>
					<ul>
						<li>
							<button type="button" onclick={handleCustomAddress} disabled={loading}>
								<FontAwesomeIcon icon={faUser} />
								<span class="name">{query}</span>
								<small>Press Enter or click to add</small>
							</button>
						</li>
					</ul>
				</div>
			{/if}

			{#if !query && filteredAddresses.length === 0}
				<div class="empty-state">
					<p>Type to search for addresses, player names, or shops.</p>
					<p>You can also enter a raw address (kkrawletii) or name (reconnected.kro).</p>
				</div>
			{/if}

			{#if query && filteredAddresses.length === 0 && !ADDRESS_REGEX.test(query) && !NAME_REGEX.test(query)}
				<div class="empty-state">
					<p>No addresses found matching "{query}"</p>
					<p>Try entering a full address (kkrawletii) or name (reconnected.kro).</p>
				</div>
			{/if}
		</div>
	</div>
</Modal>

<style>
	.address-filter-modal {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.search-input input {
		width: 100%;
		padding: 0.75em 1em;
		font-size: 1em;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.5em;
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-color-1);
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}

	.search-input input:focus {
		outline: none;
		border-color: var(--theme-color-1);
		background: rgba(255, 255, 255, 0.08);
	}

	.search-input input::placeholder {
		color: var(--text-color-2);
	}

	.address-lists {
		max-height: 400px;
		overflow-y: auto;
	}

	.address-group {
		margin-bottom: 1em;
	}

	.address-group h4 {
		font-size: 0.85em;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-color-2);
		margin: 0 0 0.5em 0;
		padding: 0 0.5em;
	}

	.address-group ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.address-group li button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75em;
		padding: 0.6em 0.75em;
		border: none;
		border-radius: 0.5em;
		background: transparent;
		color: var(--text-color-1);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s ease;
	}

	.address-group li button:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.address-group li button:active {
		background: rgba(255, 255, 255, 0.12);
	}

	.address-group li button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.address-group .avatar {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		object-fit: cover;
	}

	.address-group .name {
		font-weight: 500;
		flex-shrink: 0;
	}

	.address-group.custom button {
		border: 1px dashed rgba(var(--theme-color-rgb), 0.4);
		background: rgba(var(--theme-color-rgb), 0.05);
	}

	.address-group.custom button:hover {
		background: rgba(var(--theme-color-rgb), 0.1);
		border-color: rgba(var(--theme-color-rgb), 0.6);
	}

	.empty-state {
		text-align: center;
		padding: 2em 1em;
		color: var(--text-color-2);
	}

	.empty-state p {
		margin: 0.5em 0;
	}
</style>
