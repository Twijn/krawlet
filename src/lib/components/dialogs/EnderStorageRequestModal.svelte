<script lang="ts">
	import type { EnderStorageChest } from 'krawlet-js';
	import Modal from '../ui/Modal.svelte';
	import { getKrawletClient } from '$lib/api/krawlet';
	import { notifications } from '$lib/stores/notifications';
	import QuantitySelector from '../form/QuantitySelector.svelte';

	type Props = {
		open: boolean;
		chest: EnderStorageChest;
		onTransferCreated?: (transferId: string) => void;
	};

	let { open = $bindable(false), chest, onTransferCreated }: Props = $props();

	let selectedItem: string = $state(Object.keys(chest.contents)[0] ?? '');
	let quantity: number = $state(64);

	function onSubmit() {
		const client = getKrawletClient();
		const colors: [number, number, number] = [
			chest.colors[0]?.color ?? 0,
			chest.colors[1]?.color ?? 0,
			chest.colors[2]?.color ?? 0
		];

		const item = chest.contents[selectedItem];
		if (!item) {
			notifications.error('Selected item is not available in the chest.');
			return;
		}

		client.transfers
			.requestPublicStorage({
				itemName: item.name,
				itemNbt: typeof item.nbt === 'string' ? item.nbt : undefined,
				quantity,
				colors
			})
			.then((response) => {
				onTransferCreated?.(response.transfer.id);
				open = false;
				notifications.info('Transfer created successfully!');
			})
			.catch((err) => {
				console.error('Error sending request:', err);
				notifications.error('Failed to send request. Please try again later.');
			});
	}
</script>

<Modal {open} title="Request Ender Storage Chest" onClose={() => (open = false)} {onSubmit}>
	<label>
		Select Item
		<select bind:value={selectedItem}>
			{#each Object.entries(chest.contents) as [itemName, item] (itemName)}
				<option value={itemName}>{item.displayName}</option>
			{/each}
		</select>
	</label>
	<QuantitySelector bind:quantity max={chest.contents[selectedItem]?.count ?? 1024} />
</Modal>
