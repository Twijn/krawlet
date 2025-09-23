<script lang="ts">
	import type { Listing } from '$lib/types/shops';
	const { item }: { item: Listing } = $props();
</script>

{#if item.shopBuysItem || item.dynamicPrice || item.madeOnDemand || item.requiresInteraction}
	<div class="badges">
		{#if item.shopBuysItem}
			<span class="badge badge-sell" title="This shop purchases this item rather than selling it"
				>Sell Shop</span
			>
		{/if}
		{#if item.dynamicPrice}
			<span class="badge badge-dynamic" title="The price for this listing will dynamically change"
				>Dynamic Price</span
			>
		{/if}
		{#if item.madeOnDemand}
			<span class="badge badge-demand" title="This item is when the purchase is completed"
				>Made on Demand</span
			>
		{/if}
		{#if item.requiresInteraction}
			<span
				class="badge badge-interaction"
				title="This requires interaction with the shop's monitor, chatbox, etc."
				>Requires Interaction</span
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
	}
</style>
