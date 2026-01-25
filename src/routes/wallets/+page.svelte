<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { faPlus } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import Button from '$lib/components/ui/Button.svelte';
	import Wallets from '$lib/components/widgets/Wallets.svelte';
	import Import from '$lib/components/widgets/importexport/Import.svelte';
	import Export from '$lib/components/widgets/importexport/Export.svelte';
	import { addWalletModal } from '$lib/stores/addWalletModal';
	import { t$ } from '$lib/i18n';
</script>

<svelte:head>
	<title>Wallets | Krawlet</title>
</svelte:head>

<h1>
	<a href="/">Krawlet</a> <span>&raquo;</span>
	<a href="/wallets">{$t$('nav.wallets')}</a>
</h1>

<Wallets lgCols={12} mdCols={12} showDelete={true} showAddButton={true} />

<Import lgCols={6} mdCols={12} />
<Export lgCols={6} mdCols={12} />
