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

	let dataIn: DataType[] = $state([]);
	let dataOut: DataType[] = $state([]);
	let balanceOverTime: { date: Date; amount: number }[] = $state([]);
	let steppedBalance: { date: Date; amount: number }[] = $state([]);

	async function fetchTransactions(address: string, limit: number, timeLimit: number) {
		const allTxs: Transaction[] = [];
		let offset = 0;
		let more = true;

		while (more) {
			const resp = await kromer.addresses.getTransactions(address, { offset, limit });
			const recent = resp.transactions.filter(
				(tx) => tx.time.getTime() > Date.now() - timeLimit
			);

			allTxs.push(...recent);

			if (resp.transactions.length < limit || recent.length === 0) {
				more = false;
			} else {
				offset += limit;
			}
		}

		return allTxs;
	}

	function getSteppedBalance(data: { date: Date; amount: number }[]) {
		const stepped: { date: Date; amount: number }[] = [];

		if (!data.length) return stepped;

		let prev = data[0];
		stepped.push(prev);

		for (let i = 1; i < data.length; i++) {
			const curr = data[i];
			// flat segment at previous balance until current timestamp
			stepped.push({ date: curr.date, amount: prev.amount });
			// vertical jump to new balance
			stepped.push(curr);
			prev = curr;
		}

		return stepped;
	}

	$effect(() => {
		loading = true;
		if (browser && address) {
			fetchTransactions(address, limit, timeLimit)
				.then(async (allTxs) => {
					const addressObj = await kromer.addresses.get(address);

					// group in/out
					const groupedIn: Record<string, number> = {};
					const groupedOut: Record<string, number> = {};

					for (let i = Date.now() - timeLimit; i < Date.now(); i += 1000 * 60 * 60 * 24) {
						const day = new Date(i).toLocaleString('en-US', { month: 'numeric', day: 'numeric' });
						groupedIn[day] = 0;
						groupedOut[day] = 0;
					}

					allTxs.forEach((tx) => {
						const day = new Date(tx.time).toLocaleString('en-US', { month: 'numeric', day: 'numeric' });
						const amt = tx.from === address ? -tx.value : tx.value;
						if (tx.from === address) groupedOut[day] += amt;
						else groupedIn[day] += amt;
					});

					dataIn = Object.entries(groupedIn).map(([day, amount]) => ({ timestamp: day, amount }));
					dataOut = Object.entries(groupedOut).map(([day, amount]) => ({ timestamp: day, amount }));

					// compute balance over time
					let currentBalance = addressObj.balance;
					balanceOverTime = [
						{ date: new Date(), amount: currentBalance },
						...allTxs.map((tx) => {
							currentBalance += tx.from === address ? tx.value : -tx.value; // reversed as going backwards
							return {
								date: tx.time,
								amount: currentBalance
							};
						})
					];

					balanceOverTime.push({
						date: new Date(Date.now() - timeLimit),
						amount: currentBalance
					});

					balanceOverTime.reverse();

					// generate stepped balance
					steppedBalance = getSteppedBalance(balanceOverTime);

					loading = false;
				})
				.catch(console.error);
		}
	});
</script>

<Section lgCols={6} mdCols={12}>
	<h2><FontAwesomeIcon icon={faBarChart} /> Daily In / Out (14 Days)</h2>
	<div class="relative">
		<ModuleLoading {loading} absolute />
		<Plot
			height={350}
			x={{ type: 'band', grid: true }}
			y={{ type: 'linear', grid: true }}
		>
			<BarY data={dataIn} x="timestamp" y="amount" fill="#208eb8" inset={6} />
			<BarY data={dataOut} x="timestamp" y="amount" fill="#BD4444" inset={6} />
		</Plot>
	</div>
</Section>

<Section lgCols={6} mdCols={12}>
	<h2><FontAwesomeIcon icon={faLineChart} /> Balance over Time (Stepped)</h2>
	<div class="relative">
		<ModuleLoading {loading} absolute />
		<Plot height={350} x={{ type: 'time', grid: true }} y={{ type: 'linear', grid: true }}>
			<Line data={steppedBalance} x="date" y="amount" stroke="#28a745" />
		</Plot>
	</div>
</Section>
