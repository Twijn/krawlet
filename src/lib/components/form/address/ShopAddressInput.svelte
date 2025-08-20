<script lang="ts">
	import { verified, type VerifiedEntry } from '$lib/verified';
	import ButtonSelect from '$lib/components/ui/ButtonSelect.svelte';
	import kromer from '$lib/api/kromer';
	import type { Address } from 'kromer';
	import { paramState } from '$lib/paramState.svelte.js';

	let {
		loading = $bindable(),
		address = $bindable(),
		queryPrefix = '',
		addClearHandler
	}: {
		loading: boolean;
		address: Address | null;
		addClearHandler?: (handler: () => void) => void;
		queryPrefix?: string;
	} = $props();

	const shops: { id: string; name: string }[] = $derived(
		(() => {
			let result: { id: string; name: string }[] = [];
			for (const [, value] of Object.entries(verified)) {
				if (value.type === 'shop') {
					result.push({
						id: value.address,
						name: value.name
					});
				}
			}
			return result;
		})()
	);

	let selectedShopAddress = paramState(`${queryPrefix}shop`, '', {
		shouldSet: (value) => value.length > 0
	});
	let selectedShop: VerifiedEntry | null = $derived(verified[selectedShopAddress.value] ?? null);

	$effect(() => {
		if (selectedShop?.address) {
			loading = true;
			kromer.addresses.get(selectedShop.address).then((addr) => {
				address = addr;
				loading = false;
			});
		}
	});

	if (addClearHandler) {
		addClearHandler(() => {
			selectedShopAddress.value = '';
		});
	}
</script>

<ButtonSelect vertical={true} options={shops} bind:selected={selectedShopAddress.value} />
{#if selectedShop && address?.address}
	<small class="success">
		{selectedShop.name} ({selectedShop.address}) has {address.balance} KRO
	</small>
{/if}
