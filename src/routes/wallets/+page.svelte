<script lang="ts">
	import Wallets from '$lib/components/widgets/wallets/Wallets.svelte';
	import { t$ } from '$lib/i18n';
	import ImportModal from '$lib/components/dialogs/ImportModal.svelte';
	import { faFileExport, faFileImport, faPlus } from '@fortawesome/free-solid-svg-icons';
	import ExportModal from '$lib/components/dialogs/ExportModal.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import { addWalletModal } from '$lib/stores/addWalletModal';

	let importModalOpen = $state(false);
	let exportModalOpen = $state(false);
</script>

<svelte:head>
	<title>Wallets | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ tl: $t$('nav.wallets'), href: '/wallets' },
	]}
	buttons={[
		{
			onClick: () => (importModalOpen = true),
			icon: faFileImport,
			tk: "wallet.importButton"
		},
		{
			onClick: () => (exportModalOpen = true),
			icon: faFileExport,
			tk: "wallet.exportButton"
		},
		{
			variant: "primary",
			onClick: () => (addWalletModal.open()),
			icon: faPlus,
			tk: "wallet.addWallet"
		}
	]}
/>

<div class="col-12">
	<Wallets />
</div>

<ImportModal bind:open={importModalOpen} />
<ExportModal bind:open={exportModalOpen} />
