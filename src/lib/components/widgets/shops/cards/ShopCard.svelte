<script lang="ts">
	import type { Shop } from '$lib/types/shops';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faShop } from '@fortawesome/free-solid-svg-icons';
	import { cleanShopData } from '$lib/stores/shopsync';
	import { relativeTime } from '$lib/util';
	import Button from '$lib/components/ui/Button.svelte';

	const {
		shop,
		children
	}: {
		shop: Shop;
		children: unknown;
	} = $props();
</script>

<div class="shop">
	<div class="shop-head">
		<div class="shop-head-icon"><FontAwesomeIcon icon={faShop} /></div>
		<div class="shop-head-text">
			<h3>{cleanShopData(shop.name)}</h3>
			<small>
				{#if shop.owner}
					By {cleanShopData(shop.owner)}
				{/if}
				{#if shop.softwareName}
					{#if shop.owner}&bullet;{/if}
					{shop.softwareName}
					{#if shop.softwareVersion}
						v{shop.softwareVersion}
					{/if}
				{/if}
			</small>
			{#if shop.updatedDate}
				{@const date = new Date(shop.updatedDate)}
				<small title={date.toLocaleString()}>
					Last updated {relativeTime(date)}
				</small>
			{/if}
		</div>
	</div>
	<div class="shop-body">
		{#if typeof children === 'function'}
			{@render children()}
		{/if}
	</div>
	<div class="buttons">
		{#if shop.locationCoordinates && shop.locationCoordinates.split(' ').length === 3}
			{@const coordinates = shop.locationCoordinates.split(' ')}
			<Button
				variant="secondary"
				newTab={true}
				full={true}
				href="https://map.reconnected.cc/#world:{coordinates[0]}:{coordinates[1]}:{coordinates[2]}:40:0:0:0:1:flat"
			>
				Locate Shop
			</Button>
		{/if}
		<Button variant="primary" full={true} href="/shops/{shop.id}">View Shop</Button>
	</div>
</div>

<style>
	.shop {
		position: relative;
		display: flex;
		flex-direction: column;
		background-color: var(--background-color-2);
		min-width: 0;
		max-width: 100%;
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 1px rgba(255, 255, 255, 0.1) inset;
		transition: all 0.2s ease;
		gap: 1rem;
	}

	.shop:hover {
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.4),
			0 0 1px rgba(255, 255, 255, 0.15) inset;
		border-color: rgba(255, 255, 255, 0.12);
		transform: translateY(-2px);
	}

	.shop-head {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.shop-head-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		color: var(--theme-color);
		flex-shrink: 0;
	}

	.shop-head-text {
		flex: 1;
		min-width: 0;
	}

	.shop-head-text h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-color-1);
	}

	.shop-head-text small {
		display: block;
		font-size: 0.875rem;
		color: var(--text-color-2);
		margin-bottom: 0.25rem;
	}

	.shop-body {
		flex-grow: 1;
	}

	small[title] {
		cursor: help;
	}

	.buttons {
		display: flex;
		gap: 0.5rem;
		margin-top: auto;
	}
</style>
