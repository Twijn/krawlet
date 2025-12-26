<script lang="ts">
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import type { Address, Transaction } from 'kromer';
	import BalanceOverTime from '$lib/components/widgets/addresses/stats/BalanceOverTime.svelte';
	import TransfersByAddress from '$lib/components/widgets/addresses/stats/TransfersByAddress.svelte';
	import DailyInOut from '$lib/components/widgets/addresses/stats/DailyInOut.svelte';
	import type { Shop } from '$lib/types/shops';

	let {
		shop,
		limit = 1000,
		timeLimit = 1000 * 60 * 60 * 24 * 14
	}: {
		shop: Shop;
		limit?: number;
		timeLimit?: number;
	} = $props();

	// Use the first address from the shop for stats
	let primaryAddress = $derived(shop.addresses?.[0] ?? null);

	let addressObj: Address | null = $state(null);
	let loading: boolean = $state(false);
	let transactions: Transaction[] = $state([]);

	async function fetchTransactions(address: string, limit: number, timeLimit: number) {
		const allTxs: Transaction[] = [];
		let offset = 0;
		let more = true;

		while (more) {
			const resp = await kromer.addresses.getTransactions(address, { offset, limit });
			const recent = resp.transactions.filter((tx) => tx.time.getTime() > Date.now() - timeLimit);

			allTxs.push(...recent);

			if (resp.transactions.length < limit || recent.length === 0) {
				more = false;
			} else {
				offset += limit;
			}
		}

		return allTxs;
	}

	$effect(() => {
		if (primaryAddress) {
			kromer.addresses.get(primaryAddress).then((a) => {
				addressObj = a;
			}, console.error);
		}
	});

	$effect(() => {
		loading = true;
		if (browser && primaryAddress) {
			fetchTransactions(primaryAddress, limit, timeLimit)
				.then(async (allTxs) => {
					transactions = allTxs;
					loading = false;
				})
				.catch(console.error);
		}
	});
</script>

{#if primaryAddress}
	<DailyInOut lgCols={6} mdCols={12} bind:loading bind:transactions address={primaryAddress} />

	<TransfersByAddress lgCols={6} mdCols={12} bind:loading bind:transactions address={primaryAddress} />

	{#if addressObj}
		<BalanceOverTime lgCols={12} bind:loading bind:transactions address={addressObj} {timeLimit} />
	{/if}
{/if}
