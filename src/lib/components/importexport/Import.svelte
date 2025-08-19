<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faFileImport } from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/components/Button.svelte';
	import { decryptWithPassword } from '$lib/walletStore';
	import { walletStore } from '$lib/walletStore.js';
	import type { APIError } from 'kromer';

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
	let importData = $state('');

	async function importWallets(e: Event) {
		e.preventDefault();
		let data: unknown;
		try {
			data = JSON.parse((await decryptWithPassword(exportedPassword, importData)) ?? '');
		} catch (e) {
			console.error(e);
		}
		if (data) {
			try {
				walletStore.importWallets(data);
				exportedPassword = '';
				importData = '';
				alert('Wallets imported successfully!');
			} catch (e) {
				const err = e as APIError;
				alert('Error importing wallets: ' + err.message);
			}
			return false;
		}
		alert('Exported password or data is invalid!');
		return false;
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2>
		<FontAwesomeIcon icon={faFileImport} />
		Import Wallets
	</h2>

	<form method="post">
		<label>
			Exported Password
			<input
				type="password"
				name="exported-password"
				bind:value={exportedPassword}
				placeholder="Enter the password you used to export your wallets"
			/>
		</label>
		<label>
			Import Data
			<textarea
				rows="10"
				placeholder="Enter your JSON wallet export"
				name="import-data"
				bind:value={importData}
			></textarea>
		</label>
		<Button type="submit" variant="primary" full={true} onClick={importWallets}>
			<FontAwesomeIcon icon={faFileImport} />
			Import
		</Button>
	</form>
</Section>
