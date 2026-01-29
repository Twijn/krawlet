<script lang="ts">
	import { faAddressBook } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import Section from '$lib/components/ui/Section.svelte';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import type { Transaction } from 'kromer';
	import { formatCurrency } from '$lib/util';
	import AddressComponent from '$lib/components/widgets/addresses/Address.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		loading = $bindable(),
		address = $bindable(),
		transactions = $bindable(),
		lgCols = null,
		mdCols = null,
		smCols = null
	}: {
		loading: boolean;
		address: string;
		transactions: Transaction[];
		lgCols: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
	} = $props();

	type IOAddress = {
		address: string;
		in: number;
		out: number;
	};

	let ioAddresses: IOAddress[] = $state([]);

	$effect(() => {
		// compute transfers by address
		let newIoAddresses: IOAddress[] = [];

		for (const tx of transactions) {
			const targetAddress = tx.from === address ? tx.to : tx.from;
			if (!targetAddress) continue;

			let foundRecord = newIoAddresses.find((a) => a.address === targetAddress);

			if (!foundRecord) {
				foundRecord = {
					address: targetAddress,
					in: 0,
					out: 0
				};
				newIoAddresses.push(foundRecord);
			}

			if (tx.from === address) {
				foundRecord.out += tx.value;
			} else {
				foundRecord.in += tx.value;
			}
		}
		newIoAddresses.sort((a, b) => b.in - b.out - (a.in - a.out));

		ioAddresses = newIoAddresses;
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faAddressBook} /> Transfers by Address (14 Days)</h2>
	<div class="table-container">
		<ModuleLoading {loading} absolute />
		<table>
			<thead>
				<tr>
					<th>Address</th>
					<th class="right">Received</th>
					<th class="right">Sent</th>
					<th class="right">Net</th>
				</tr>
			</thead>
			<tbody>
				{#each ioAddresses as ioa (ioa.address)}
					<tr>
						<td><AddressComponent address={ioa.address} /></td>
						<td class="right">{formatCurrency(ioa.in)} <small>KRO</small></td>
						<td class="right">{formatCurrency(ioa.out)} <small>KRO</small></td>
						<td class="right">{formatCurrency(ioa.in - ioa.out)} <small>KRO</small></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Section>

<style>
	.table-container {
		max-height: 350px;
		overflow: auto;
	}
</style>
