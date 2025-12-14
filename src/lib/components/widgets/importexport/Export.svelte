<script lang="ts">
	import { slide } from 'svelte/transition';
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCopy, faFileExport } from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/components/ui/Button.svelte';
	import { notifications } from '$lib/stores/notifications';
	import settings, { encryptWithPassword } from '$lib/stores/settings';
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
	let exportData = $state('');

	async function exportWallets(e: Event) {
		e.preventDefault();

		exportData = await encryptWithPassword(exportedPassword, settings.export());

		return false;
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(exportData);
		notifications.success($t$('wallet.exportCopied'));
	}
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2>
		<FontAwesomeIcon icon={faFileExport} />
		{$t$('wallet.exportWallets')}
	</h2>
	<form method="post">
		<label>
			{$t$('wallet.exportedPasswordOptional')}
			<input
				type="password"
				name="exported-password"
				bind:value={exportedPassword}
				placeholder={$t$('wallet.exportedPasswordPlaceholder')}
			/>
			<small>
				{$t$('wallet.exportedPasswordHint')}
			</small>
		</label>
		<Button type="submit" variant="secondary" onClick={exportWallets} full={true}>
			<FontAwesomeIcon icon={faFileExport} />
			{$t$('wallet.exportButton')}
		</Button>
		{#if exportData.length > 0}
			<label transition:slide>
				{$t$('wallet.exportData')}
				<textarea
					rows="10"
					placeholder={$t$('wallet.importDataPlaceholder')}
					name="export-data"
					bind:value={exportData}
					disabled
				></textarea>
				<Button type="button" variant="secondary" onClick={copyToClipboard} full={true}>
					<FontAwesomeIcon icon={faCopy} />
					{$t$('wallet.copyToClipboard')}
				</Button>
			</label>
		{/if}
	</form>
</Section>
