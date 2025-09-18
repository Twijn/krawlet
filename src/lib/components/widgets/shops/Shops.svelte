<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import shopsync, { cleanShopData } from '$lib/stores/shopsync';
	import type { Shop } from '$lib/types/shops';
	import { faShop } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import Address from '../addresses/Address.svelte';
	import { relativeTime } from '$lib/util';
	import { onMount } from 'svelte';
	import ModuleLoading from '../other/ModuleLoading.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = null,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	let shops: Shop[] = $state([]);

	onMount(() => {
		shopsync.subscribe((data) => {
			shops = data.data;
		});
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faShop} /> Shops</h2>
	{#if shops.length === 0}
		<ModuleLoading />
	{/if}
	<div class="shop-grid">
		{#each shops as shop (shop.computerId)}
			{@const items = shop?.items ?? []}
			{@const totalStock = items.reduce((v, l) => v + l.stock, 0)}
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
					<table>
						<tbody>
							<tr>
								<th>Total Items</th>
								<td class="right"
									>{items.length} <small>listing{items.length === 1 ? '' : 's'}</small></td
								>
							</tr>
							<tr>
								<th>Total Stock</th>
								<td class="right"
									>{totalStock.toLocaleString()}
									<small>item{totalStock === 1 ? '' : 's'}</small></td
								>
							</tr>
							{#if shop.addresses}
								{#each shop.addresses as address (address)}
									{#if address.length === 10 && address.startsWith('k')}
										<tr>
											<th>Address</th>
											<td class="right"><Address {address} /></td>
										</tr>
									{/if}
								{/each}
							{/if}
						</tbody>
					</table>
					<p></p>
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
		{/each}
	</div>
</Section>

<style>
	.shop-grid {
		--shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
		display: grid;
		grid-template-columns: 1fr;
		gap: 1em;
	}

	@media only screen and (min-width: 1100px) {
		.shop-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media only screen and (min-width: 1500px) {
		.shop-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media only screen and (min-width: 2000px) {
		.shop-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

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

	.shop-body p {
		margin: 0;
	}

	small[title] {
		cursor: pointer;
	}
</style>
