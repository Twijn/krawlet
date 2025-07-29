<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faAddressBook,
		faMoneyBill1Wave,
		faPaperPlane,
		faTruckFast
	} from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/components/Button.svelte';

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
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faTruckFast} /> Quick Actions</h2>

	<nav>
		<h3>Transactions</h3>
		<Button variant="success" href="/transactions/new" full={true}>
			<FontAwesomeIcon icon={faPaperPlane} />
			Send Kromer
		</Button>

		<Button variant="primary" href="/transactions" full={true}>
			<FontAwesomeIcon icon={faAddressBook} />
			All Transactions
		</Button>

		<h3>Addresses</h3>
		<Button variant="primary" href="/addresses/rich" full={true}>
			<FontAwesomeIcon icon={faMoneyBill1Wave} />
			Richest Addresses
		</Button>

		<Button variant="secondary" href="/addresses" full={true}>
			<FontAwesomeIcon icon={faAddressBook} />
			All Addresses
		</Button>
	</nav>
</Section>

<style>
	nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	h3 {
		font-size: 0.9rem;
		font-weight: 500;
		text-transform: uppercase;
		text-align: center;
		margin: 0.25em 0;
	}
</style>
