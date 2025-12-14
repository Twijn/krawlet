<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import AddressSelector from '$lib/components/widgets/addresses/AddressSelector.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { faSearch } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { t$ } from '$lib/i18n';

	let address = $state('');

	const copy = () => {
		if (!address || address.length === 0) {
			notifications.warning($t$('address.selectAddressFirst'));
			return;
		}

		navigator.clipboard
			.writeText(address)
			.then(() => {
				notifications.success($t$('address.copiedToClipboard', { address }));
			})
			.catch((e) => {
				console.error(e);
				notifications.error($t$('address.copyFailed'));
			});
	};
</script>

<svelte:head>
	<title>Address Search | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/addresses">{$t$('nav.addresses')}</a> <span>&raquo;</span>
	<a href="/addresses/search">{$t$('common.search')}</a>
</h1>

<div class="col-12">
	<Section>
		<h2><FontAwesomeIcon icon={faSearch} /> {$t$('address.searchTitle')}</h2>
		<p>{$t$('address.searchDescription')}</p>
		<p>
			{$t$('address.searchHint', { exampleAddress: 'ktwijnmall', exampleName: 'reconnected.kro' })}
		</p>
		<AddressSelector label={$t$('address.address')} bind:address />
		<div class="buttons">
			<Button type="button" variant="secondary" full onClick={copy}
				>{$t$('wallet.copyToClipboard')}</Button
			>
			<Button
				variant="primary"
				full
				href={`/addresses/${address}`}
				disabled={!address}
				title={!address ? $t$('address.selectAddressAbove') : undefined}
			>
				{$t$('address.viewAddress')}
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
