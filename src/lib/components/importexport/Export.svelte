<script lang="ts">
	import {slide} from 'svelte/transition';
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCopy, faFileExport } from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/components/Button.svelte';
	import { walletStore } from '$lib/walletStore';
	import { encryptWithPassword } from '$lib/walletStore.js';

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

	let exportedPassword = $state('');
	let exportData = $state('');

	async function exportWallets(e: Event) {
		e.preventDefault();

		exportData = await encryptWithPassword(
			exportedPassword,
			walletStore.exportWallets()
		);

		return false;
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(exportData);
		alert("Copied export data to clipboard. Paste it into the Krawlet app to import your wallets.");
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2>
		<FontAwesomeIcon icon={faFileExport} />
		Export Wallets
	</h2>
	<form method="post">
		<label>
			Exported Password (Optional)
			<input type="password" name="exported-password"  bind:value={exportedPassword} placeholder="Enter the password you want to use to export your wallets" />
			<small>
				This is usually different from your master password.
				Don't forget this password as you will need it to import your wallets.
			</small>
		</label>
		<Button type="submit" variant="secondary" onClick={exportWallets} full={true}>
			<FontAwesomeIcon icon={faFileExport} />
			Export
		</Button>
		{#if exportData.length > 0}
			<label transition:slide>
				Export Data
				<textarea rows="10" placeholder="Enter your JSON wallet export" name="export-data" bind:value={exportData}
									disabled></textarea>
				<Button type="button" variant="secondary" onClick={copyToClipboard} full={true}>
					<FontAwesomeIcon icon={faCopy} />
					Copy to Clipboard
				</Button>
			</label>
		{/if}
	</form>
</Section>
