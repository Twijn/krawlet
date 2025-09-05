<script lang="ts">
	import { faLineChart } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import Section from '$lib/components/ui/Section.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { Plot, Line } from 'svelteplot';
	import type { Address, Transaction } from 'kromer';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const defaultTimeLimit = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

	const {
		loading = $bindable(),
		address = $bindable(),
		transactions = $bindable(),
		timeLimit = defaultTimeLimit,
		lgCols = null,
		mdCols = null,
		smCols = null
	}: {
		loading: boolean;
		address: Address;
		transactions: Transaction[];
		timeLimit?: number;
		lgCols: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	type DataType = {
		date: Date;
		amount: number;
	};

	let steppedBalance: DataType[] = $state([]);

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
		// compute balance over time
		let currentBalance = address?.balance ?? 0;
		let balanceOverTime = [
			{ date: new Date(), amount: currentBalance },
			...transactions.map((tx) => {
				currentBalance += tx.from === address?.address ? tx.value : -tx.value; // reversed as going backwards
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

		steppedBalance = getSteppedBalance(balanceOverTime);
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faLineChart} /> Balance over Time (14 Days)</h2>
	<div class="relative">
		<ModuleLoading {loading} absolute />
		<Plot height={350} x={{ type: 'time', grid: true }} y={{ type: 'linear', grid: true }}>
			<Line data={steppedBalance} x="date" y="amount" stroke="#208eb8" />
		</Plot>
	</div>
</Section>
