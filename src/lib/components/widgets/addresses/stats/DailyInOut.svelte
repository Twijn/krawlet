<script lang="ts">
	import { faBarChart } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import Section from '$lib/components/ui/Section.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import { Plot, BarY } from 'svelteplot';
	import type { Transaction } from 'kromer';

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
		address: string;
		transactions: Transaction[];
		timeLimit?: number;
		lgCols: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	type DataType = {
		timestamp: string;
		amount: number;
	};

	let dataIn: DataType[] = $state([]);
	let dataOut: DataType[] = $state([]);

	function parseDate(date: string | number | Date): string {
		return new Date(date).toLocaleString(undefined, { month: '2-digit', day: '2-digit' });
	}

	$effect(() => {
		// group in/out
		const groupedIn: Record<string, number> = {};
		const groupedOut: Record<string, number> = {};

		for (let i = Date.now() - timeLimit; i < Date.now(); i += 1000 * 60 * 60 * 24) {
			const day = parseDate(i);
			groupedIn[day] = 0;
			groupedOut[day] = 0;
		}

		transactions.forEach((tx) => {
			const day = parseDate(tx.time);
			const amt = tx.from === address ? -tx.value : tx.value;
			if (tx.from === address) groupedOut[day] += amt;
			else groupedIn[day] += amt;
		});

		dataIn = Object.entries(groupedIn).map(([day, amount]) => ({ timestamp: day, amount }));
		dataOut = Object.entries(groupedOut).map(([day, amount]) => ({ timestamp: day, amount }));
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faBarChart} /> Daily In / Out (14 Days)</h2>
	<div class="relative">
		<ModuleLoading {loading} absolute />
		<Plot height={350} x={{ type: 'band', grid: true }} y={{ type: 'linear', grid: true }}>
			<BarY data={dataIn} x="timestamp" y="amount" fill="#39a667" inset={6} />
			<BarY data={dataOut} x="timestamp" y="amount" fill="#BD4444" inset={6} />
		</Plot>
	</div>
</Section>
