<script lang="ts">
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import { formatCurrency } from '$lib/util';
	import type { AddressesResponse } from 'kromer';
	import { t$ } from '$lib/i18n';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	const SERVERWELF_ADDRESS = 'serverwelf';

	let loading: boolean = $state(true);
	let totalAddresses: number = $state(0);
	let top10Balance: number = $state(0);
	let totalSupply: number = $state(0);

	$effect(() => {
		if (browser) {
			loading = true;

			// Get total addresses count
			kromer.addresses
				.getAll({ limit: 1 })
				.then((result: AddressesResponse) => {
					totalAddresses = result.total;
				})
				.catch(console.error);

			// Get supply from API
			kromer
				.getSupply()
				.then((supply: number) => {
					totalSupply = supply;
				})
				.catch(console.error);

			// Get top richest addresses (excluding serverwelf) for wealth distribution
			kromer.addresses
				.getRich({ limit: 15 })
				.then((result: AddressesResponse) => {
					const filtered = result.addresses.filter((addr) => addr.address !== SERVERWELF_ADDRESS);
					top10Balance = filtered.slice(0, 10).reduce((sum, addr) => sum + addr.balance, 0);
					loading = false;
				})
				.catch(console.error);
		}
	});

	let top10Percentage_derived = $derived(totalSupply > 0 ? (top10Balance / totalSupply) * 100 : 0);
</script>

<div
	class="col-{lgCols} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''} statistics"
>
	<div class="statistic">
		<h2>{$t$('stats.totalAddresses')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{totalAddresses.toLocaleString()}
			{/if}
		</div>
	</div>
	<div class="statistic">
		<h2>{$t$('stats.totalSupply')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{formatCurrency(totalSupply)} <small>KRO</small>
			{/if}
		</div>
	</div>
	<div class="statistic">
		<h2>{$t$('stats.top10Wealth')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{formatCurrency(top10Balance)} <small>KRO</small>
			{/if}
		</div>
	</div>
	<div class="statistic mobile-hide">
		<h2>{$t$('stats.wealthConcentration')}</h2>
		<div>
			{#if loading}
				<span class="loading">...</span>
			{:else}
				{top10Percentage_derived.toFixed(1)}<small>%</small>
			{/if}
		</div>
	</div>
</div>

<style>
	.loading {
		opacity: 0.5;
	}
</style>
