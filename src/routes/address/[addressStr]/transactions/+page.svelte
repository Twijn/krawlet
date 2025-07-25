<script lang="ts">
	import Transactions from '$lib/components/Transactions.svelte';
	import Alert from '$lib/components/Alert.svelte';

	const { data } = $props();
	const { address } = data;
</script>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span> Address <span>&raquo;</span>
	<a href="/address/{address.address}">{address.address}</a> <span>&raquo;</span>
	<a href="/address/{address.address}/transactions">Transactions</a>
</h1>

<div class="col-12">
	<Alert variant="info">
		Recent Transactions will show more pages than there are for this address. This is a bug with
		Kromer, not with Krawlet.
	</Alert>
</div>

<Transactions address={address.address} />
