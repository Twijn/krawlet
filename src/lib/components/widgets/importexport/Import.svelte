<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faFileImport } from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/components/ui/Button.svelte';
	import type { APIError } from 'kromer';
	import { notifications } from '$lib/stores/notifications';
	import { get } from 'svelte/store';
	import settings, { decryptWithPassword } from '$lib/stores/settings';
	import { t$ } from '$lib/i18n';

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
				settings.import(data);
				exportedPassword = '';
				importData = '';
				const walletCount = get(settings).wallets.length;
				notifications.success($t$('wallet.importSuccess', { count: walletCount }));
			} catch (e) {
				const err = e as APIError;
				notifications.error($t$('wallet.importError', { message: err.message }));
			}
			return false;
		}
		notifications.error($t$('wallet.importInvalid'));
		return false;
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2>
		<FontAwesomeIcon icon={faFileImport} />
		{$t$('wallet.importWallets')}
	</h2>

	<form method="post">
		<label>
			{$t$('wallet.exportedPassword')}
			<input
				type="password"
				name="exported-password"
				bind:value={exportedPassword}
				placeholder={$t$('wallet.importPasswordPlaceholder')}
			/>
		</label>
		<label>
			{$t$('wallet.importData')}
			<textarea
				rows="10"
				placeholder={$t$('wallet.importDataPlaceholder')}
				name="import-data"
				bind:value={importData}
			></textarea>
		</label>
		<Button type="submit" variant="primary" full={true} onClick={importWallets}>
			<FontAwesomeIcon icon={faFileImport} />
			{$t$('wallet.importButton')}
		</Button>
	</form>
</Section>
