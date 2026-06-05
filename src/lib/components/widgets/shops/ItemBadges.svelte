<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import type { Listing } from '$lib/types/shops';
	import Tag from '$lib/components/ui/Tag.svelte';
	const { item }: { item: Listing } = $props();
</script>

{#if item.shopBuysItem || item.dynamicPrice || item.madeOnDemand || item.requiresInteraction}
	<div class="badges">
		{#if item.shopBuysItem}
			<button
				class="badge-button"
				onclick={() => notifications.info('This shop purchases this item rather than selling it')}
			>
				<Tag variant="red" size="md">Sell Shop</Tag>
			</button>
		{/if}
		{#if item.dynamicPrice}
			<button
				class="badge-button"
				onclick={() =>
					notifications.info("This item's price changes based on stock, demand, or other factors")}
			>
				<Tag variant="green" size="md">Dynamic Price</Tag>
			</button>
		{/if}
		{#if item.madeOnDemand}
			<button
				class="badge-button"
				onclick={() =>
					notifications.info(
						'This item is crafted, smelted, or processed on purchase rather than being pre-stocked'
					)}
			>
				<Tag variant="blue" size="md">Made on Demand</Tag>
			</button>
		{/if}
		{#if item.requiresInteraction}
			<button
				class="badge-button"
				onclick={() =>
					notifications.info("This requires interaction with the shop's monitor, chatbox, etc.")}
			>
				<Tag variant="red" size="md">Requires Interaction</Tag>
			</button>
		{/if}
	</div>
{/if}

<style>
	.badges {
		display: flex;
		justify-content: center;
		gap: 0.5em;
		margin-bottom: 0.5em;
	}

	.badge-button {
		background: none;
		padding: 0;
		border: none;
		cursor: pointer;
	}
</style>
