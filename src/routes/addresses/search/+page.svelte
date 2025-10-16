<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import AddressSelector from '$lib/components/widgets/addresses/AddressSelector.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { faSearch } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	let address = $state('');

	const copy = () => {
		if (!address || address.length === 0) {
			notifications.warning('Please select an address first!');
			return;
		}

		navigator.clipboard
			.writeText(address)
			.then(() => {
				notifications.success(`Address ${address} copied to clipboard`);
			})
			.catch((e) => {
				console.error(e);
				notifications.error('Failed to copy address to clipboard!');
			});
	};
</script>

<svelte:head>
	<title>Address Search | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/addresses">Addresses</a> <span>&raquo;</span>
	<a href="/addresses/search">Search</a>
</h1>

<div class="col-12">
	<Section>
		<h2><FontAwesomeIcon icon={faSearch} /> Address Search</h2>
		<p>Use the field below to search for addresses.</p>
		<p>
			If the address you're looking for does not show up as a known address, you can also type in
			the entire address (i.e <code>ktwijnmall</code>) or name (i.e <code>reconnected.kro</code>)
		</p>
		<AddressSelector label="Address" bind:address />
		<div class="buttons">
			<Button type="button" variant="secondary" full onClick={copy}>Copy to Clipboard</Button>
			<Button
				variant="primary"
				full
				href={`/addresses/${address}`}
				disabled={!address}
				title={!address ? 'Please select an address above' : undefined}
			>
				View Address
			</Button>
		</div>
	</Section>
</div>

<style>
	div.col-12 {
		max-width: 35em;
	}

	.buttons {
		margin-top: 1em;
	}
</style>
