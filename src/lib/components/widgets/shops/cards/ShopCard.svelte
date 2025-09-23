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
	<div class="shop-body table-container">
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
		display: flex;
		flex-direction: column;
		background-color: var(--background-color-1);
		padding: 0.8em;
		border-radius: 0.75em 0.25em;
		box-shadow: var(--shadow);
	}

	.shop-head {
		display: flex;
		gap: 0.75em;
		align-items: center;
	}

	.shop-head-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2em;
		width: 2em;
		height: 2em;
		background-color: var(--theme-color-2);
		color: var(--background-color-1);
		border-radius: 1em;
		box-shadow: var(--shadow);
		text-shadow: var(--shadow);
	}

	.shop-head-text {
		flex-grow: 1;
	}

	.shop-head-text h3 {
		margin: 0;
		font-weight: 300;
	}

	.shop-head-text small {
		display: block;
	}

	.shop-body {
		flex-grow: 1;
		margin: 0.5em 0;
	}

	small[title] {
		cursor: pointer;
	}
</style>
