<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import settings from '$lib/stores/settings';
	import apiKeyInfo from '$lib/stores/apiKeyInfo';
	import { getItemImageUrl, getShopById, type ItemListing } from '$lib/stores/shopsync';
	import type { Listing, Shop } from '$lib/types/shops';
	import { formatCurrency, getMinecraftAvatar } from '$lib/util';
	import Modal from '../ui/Modal.svelte';
	import AddressSelector from '../widgets/addresses/AddressSelector.svelte';
	import Alert from './Alert.svelte';
	import kromer from '$lib/api/kromer';
	import type { APIError } from 'kromer';
	import QuantitySelector from '../form/QuantitySelector.svelte';

	let {
		open = $bindable(),
		item
	}: {
		open: boolean;
		item: ItemListing | Listing;
	} = $props();

	let privatekey = $state('');
	let address = $state('');
	let quantity = $state(1);

	let shop = $state<Shop | null>(null);
	const canUseKlog = $derived(
		shop?.softwareVersion?.toLowerCase()?.includes('+klog') &&
			$settings.krawletApiKey.startsWith('kraw_')
	);
	const mcIdentifier = $derived($apiKeyInfo.mcUuid ?? $apiKeyInfo.mcName ?? null);
	const stock = $derived('stock' in item && item.stock > 0 ? item.stock : 0);

	const priceEntry = $derived(
		'prices' in item && item.prices && item.prices.length > 0
			? (item.prices.find((p) => p.currency.toLowerCase() === 'kro') ?? item.prices[0])
			: null
	);
	const shopAddress = $derived(priceEntry ? priceEntry.address : null);
	const hasValidShopAddress = $derived(
		!!shopAddress && shopAddress.length === 10 && shopAddress.startsWith('k')
	);
	const grandTotal = $derived(priceEntry ? priceEntry.value * quantity : 0);

	$effect(() => {
		if ('shopId' in item) {
			getShopById(item.shopId).then((s) => {
				shop = s;
			});

			if (open && canUseKlog) {
				apiKeyInfo.ensureLoaded();
			}

			if (open && !canUseKlog) {
				notifications.error(
					"Klog integration requires a Krawlet API key with Klog access and the shop must be running a Klog-compatible version. Please check your settings and the shop's software version."
				);
				open = false;
			}
		}
	});

	async function onSubmit() {
		if (!privatekey || privatekey.length === 0) {
			notifications.error('Please select or enter a private key to make a purchase.');
			return;
		}

		if (grandTotal === null || isNaN(grandTotal)) {
			notifications.error('Unable to determine total cost for purchase.');
			return;
		}

		if (grandTotal <= 0) {
			notifications.error('Total cost must be greater than zero.');
			return;
		}

		if (!hasValidShopAddress) {
			notifications.error('Shop does not have a valid Klog address for receiving payments.');
			return;
		}

		if (!shopAddress) {
			notifications.error('Shop does not have a Klog address for receiving payments.');
			return;
		}

		try {
			await kromer.transactions.send({
				privatekey,
				to: shopAddress,
				amount: grandTotal ?? 0,
				metadata: `${priceEntry?.requiredMeta};useruuid=${$apiKeyInfo.mcUuid};username=${$apiKeyInfo.mcName};klog`
			});

			notifications.success(
				`Payment sent to ${shop?.name ?? shopAddress}. Your Klog purchase should process shortly.`
			);
			open = false;
		} catch (e) {
			const err = e as APIError;
			notifications.error(err.message ?? 'Failed to send payment for this Klog purchase.');
		}
	}
</script>

<Modal
	bind:open
	{onSubmit}
	onClose={() => (open = false)}
	title="Purchase with Klog"
	confirmButtonOverrides={{
		disabled:
			!canUseKlog || stock <= 0 || quantity <= 0 || !hasValidShopAddress || !privatekey || !address
	}}
>
	<div class="item-display">
		<img src={getItemImageUrl(item)} alt="Item icon for {item.itemDisplayName}" />
		<div class="item-display-text">
			<h3>{item.itemDisplayName}</h3>
			<small title={item.itemNbt ? `NBT: ${item.itemNbt}` : undefined}>{item.itemName}</small>
		</div>
	</div>
	<AddressSelector mode="privatekey" bind:privatekey bind:address label="From / Sender Address" />
	{#if mcIdentifier}
		<Alert variant="info">
			<strong>Items will be sent via Klog to:</strong>
			<div class="minecraft-player">
				<img
					src={getMinecraftAvatar(mcIdentifier)}
					alt={$apiKeyInfo.mcName ? `Avatar for ${$apiKeyInfo.mcName}` : 'Minecraft avatar'}
				/>
				{#if $apiKeyInfo.mcName}
					<span class="minecraft-name">{$apiKeyInfo.mcName}</span>
				{/if}
			</div>
		</Alert>
	{/if}
	<QuantitySelector bind:quantity min={1} max={stock} label="Purchase Quantity" />
	<p>
		Purchasing x{typeof quantity == 'number' ? quantity : 1}
		{item.itemDisplayName} from {shop ? shop.name : 'the shop'}
	</p>
	<p>
		<strong>Total Cost:</strong>
		{formatCurrency(!grandTotal || isNaN(grandTotal) ? 0 : grandTotal, 5)} <small>KRO</small>
	</p>
</Modal>

<style>
	.item-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.item-display img {
		width: 64px;
		height: 64px;
	}

	.item-display h3,
	p,
	.item-display small,
	.minecraft-player span {
		display: block;
		margin: 0;
	}

	.minecraft-player {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0.5rem 0 0 0;
	}

	.minecraft-player img {
		width: 24px;
		height: 24px;
		border-radius: 4px;
	}

	.minecraft-name {
		font-size: 0.95rem;
		color: var(--text-color-1);
	}
</style>
