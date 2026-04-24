<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import type { Listing } from '$lib/types/shops';
	const { item }: { item: Listing } = $props();
</script>

{#if item.shopBuysItem || item.dynamicPrice || item.madeOnDemand || item.requiresInteraction}
	<div class="badges">
		{#if item.shopBuysItem}
			<button
				class="badge badge-sell"
				onclick={() => notifications.info('This shop purchases this item rather than selling it')}
				>Sell Shop</button
			>
		{/if}
		{#if item.dynamicPrice}
			<button
				class="badge badge-dynamic"
				onclick={() =>
					notifications.info("This item's price changes based on stock, demand, or other factors")}
			>
				Dynamic Price
			</button>
		{/if}
		{#if item.madeOnDemand}
			<button
				class="badge badge-demand"
				onclick={() =>
					notifications.info(
						'This item is crafted, smelted, or processed on purchase rather than being pre-stocked'
					)}>Made on Demand</button
			>
		{/if}
		{#if item.requiresInteraction}
			<button
				class="badge badge-interaction"
				onclick={() =>
					notifications.info("This requires interaction with the shop's monitor, chatbox, etc.")}
				>Requires Interaction</button
			>
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

	.badge-dynamic {
		--color: var(--green);
	}

	.badge-demand {
		--color: var(--blue);
	}

	.badge-interaction {
		--color: var(--red);
	}

	.badge-sell {
		--color: var(--red);
		font-weight: 500;
	}

	.badge {
		background: rgba(var(--color), 0.2);
		color: white;
		border-radius: 0.5em;
		padding: 0.2em 0.7em;
		font-size: 0.85em;
		font-weight: 500;
		white-space: nowrap;
		border: 1px solid rgba(var(--color), 0.4);
		cursor: pointer;
	}
</style>
