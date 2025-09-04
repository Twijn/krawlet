<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBarChart, faLineChart } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { browser } from '$app/environment';
	import kromer from '$lib/api/kromer';
	import type { Transaction } from 'kromer';
	import { BarY, Line, Plot } from 'svelteplot';

	const {
		address = $bindable(),
		limit = 1000,
		timeLimit = 1000 * 60 * 60 * 24 * 14
	}: {
		address: string;
		limit?: number;
		timeLimit?: number;
	} = $props();

	type DataType = {
		timestamp: string;
		amount: number;
	};

	let loading: boolean = $state(false);

	let dataIn: DataType[] | null = $state(null);
	let dataOut: DataType[] | null = $state(null);
	let balanceOverTime: {date: Date, amount: number}[] = $state([]);

	async function fetchTransactions(address: string, limit: number, timeLimit: number) {
		const allTxs: Transaction[] = [];
		let offset = 0;
		let more = true;

		while (more) {
			const resp = await kromer.addresses.getTransactions(address, { offset, limit });
			const recent = resp.transactions.filter(tx => tx.time.getTime() > Date.now() - timeLimit);

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
		loading = true;
		if (browser && address) {
			fetchTransactions(address, limit, timeLimit)
				.then(async allTxs => {
					const addressObj = await kromer.addresses.get(address);

					// group in/out
					const groupedIn: Record<string, number> = {};
					const groupedOut: Record<string, number> = {};

					for (let i = Date.now() - timeLimit; i < Date.now(); i += 1000 * 60 * 60 * 24) {
						const day = new Date(i).toLocaleString('en-US', { month: 'numeric', day: 'numeric' });
						groupedIn[day] = 0;
						groupedOut[day] = 0;
					}

					allTxs.forEach(tx => {
						const day = new Date(tx.time).toLocaleString('en-US', { month: 'numeric', day: 'numeric' });
						const amt = tx.from === address ? -tx.value : tx.value;
						if (tx.from === address) groupedOut[day] += amt;
						else groupedIn[day] += amt;

					});

					dataIn = Object.entries(groupedIn).map(([day, amount]) => ({ timestamp: day, amount }));
					dataOut = Object.entries(groupedOut).map(([day, amount]) => ({ timestamp: day, amount }));

					let currentBalance = addressObj.balance;
					balanceOverTime = allTxs.map(x => {
						currentBalance += x.from === address ? -x.value : x.value;
						return {
							date: x.time,
							amount: currentBalance
						};
					});

					balanceOverTime.reverse();

					loading = false;
				})
				.catch(console.error);
		}
	});

</script>

<Section lgCols={6} mdCols={6}>
	<h2><FontAwesomeIcon icon={faBarChart} /> Daily In / Out (7 Days)</h2>
	<div class="relative">
		<ModuleLoading {loading} absolute />
		{#if dataIn && dataOut}
			<Plot height={350} x={{
				type: "band",
				grid: true,
			}}

			y={{
				type: "linear",
				grid: true,
			}}>
				<BarY
					data={dataIn}
					x="timestamp"
					y="amount"
					fill="#208eb8"
					inset={6}
				/>

				<BarY
					data={dataOut}
					x="timestamp"
					y="amount"
					fill="#BD4444"
					inset={6}
				/>
			</Plot>
		{/if}
	</div>
</Section>

<Section lgCols={6} mdCols={12}>
	<h2><FontAwesomeIcon icon={faLineChart} /> Balance over Time</h2>
	{#if balanceOverTime && !loading}
		<Plot height={350}>
			<Line
				data={balanceOverTime}
				x="date"
				y="amount"
			/>
		</Plot>
	{:else}
		<ModuleLoading />
	{/if}
</Section>
