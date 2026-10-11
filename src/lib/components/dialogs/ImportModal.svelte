<script lang="ts">
	import { faFileImport } from '@fortawesome/free-solid-svg-icons';
	import Button from '../ui/Button.svelte';
	import Modal from '../ui/Modal.svelte';
	import settings, {
		createWalletImportPlan,
		decryptWithPassword,
		type WalletImportPlanEntry
	} from '$lib/stores/settings';
	import { t$ } from '$lib/i18n';
	import { get } from 'svelte/store';
	import { notifications } from '$lib/stores/notifications';
	import type { APIError } from 'kromer';
	import ButtonSelect from '../ui/ButtonSelect.svelte';
	import { masterPasswordStore } from '$lib/stores/masterPassword';

	let {
		open = $bindable(false)
	}: {
		open: boolean;
	} = $props();

	let importType = $state<'file' | 'text'>('file');
	let exportedPassword = $state('');
	let sourceMasterPassword = $state('');
	let showSourceMasterPassword = $state(false);
	let importData = $state('');
	let previewStatus = $state<
		'idle' | 'awaiting-password' | 'validating' | 'ready' | 'invalid' | 'empty'
	>('idle');
	let previewItems = $state<WalletImportPlanEntry[]>([]);
	let previewWalletCount = $state(0);
	let previewAddCount = $state(0);
	let previewRenameCount = $state(0);
	let previewRequiresMigration = $state(false);
	let previewToken = 0;

	const MAX_PREVIEW_WALLETS = 4;

	$effect(() => {
		const payload = importData.trim();
		const password = exportedPassword;
		const token = ++previewToken;

		previewItems = [];
		previewWalletCount = 0;
		previewAddCount = 0;
		previewRenameCount = 0;
		previewRequiresMigration = false;

		if (!payload) {
			previewStatus = 'idle';
			return;
		}

		if (!password.trim()) {
			previewStatus = 'awaiting-password';
			return;
		}

		previewStatus = 'validating';

		const timeout = setTimeout(async () => {
			const decrypted = await decryptWithPassword(password, payload);
			if (token !== previewToken) return;

			if (!decrypted) {
				previewStatus = 'invalid';
				return;
			}

			try {
				const currentWallets = get(settings).wallets;
				const plan = createWalletImportPlan(currentWallets, JSON.parse(decrypted));
				if (token !== previewToken) return;

				previewWalletCount = plan.total;
				previewAddCount = plan.added;
				previewRenameCount = plan.renamed;
				previewRequiresMigration = currentWallets.length > 0 && plan.added > 0;
				previewItems = plan.entries.slice(0, MAX_PREVIEW_WALLETS);
				previewStatus = plan.total > 0 ? 'ready' : 'empty';
			} catch {
				if (token !== previewToken) return;
				previewStatus = 'invalid';
			}
		}, 300);

		return () => clearTimeout(timeout);
	});

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
				let result;
				const currentWallets = get(settings).wallets;
				const plan = createWalletImportPlan(currentWallets, data);
				const requiresMigration = currentWallets.length > 0 && plan.added > 0;

				if (requiresMigration) {
					let targetMasterPassword = '';
					try {
						targetMasterPassword = await masterPasswordStore.get();
					} catch {
						notifications.error($t$('wallet.importMasterPasswordRequired'));
						return false;
					}

					if (showSourceMasterPassword && !sourceMasterPassword.trim()) {
						notifications.error($t$('wallet.importSourceMasterPasswordRequired'));
						return false;
					}

					const sourcePassword = showSourceMasterPassword
						? sourceMasterPassword.trim()
						: exportedPassword;

					result = await settings.import(data, {
						reencryptToTarget: true,
						sourceMasterPassword: sourcePassword,
						targetMasterPassword
					});
				} else {
					result = await settings.import(data);
				}

				exportedPassword = '';
				sourceMasterPassword = '';
				showSourceMasterPassword = false;
				importData = '';
				if (result.reencrypted > 0) {
					notifications.success(
						$t$('wallet.importSuccessReencrypted', {
							count: result.total,
							reencrypted: result.reencrypted
						})
					);
				} else {
					notifications.success($t$('wallet.importSuccess', { count: result.total }));
				}
			} catch (e) {
				const err = e as APIError;
				if (err.error === 'source_master_password_invalid' && !showSourceMasterPassword) {
					showSourceMasterPassword = true;
					notifications.info($t$('wallet.importSourceMasterPasswordNeeded'));
					return false;
				}
				if (err.error === 'source_master_password_invalid' && showSourceMasterPassword) {
					notifications.error($t$('wallet.importSourceMasterPasswordRequired'));
					return false;
				}
				notifications.error($t$('wallet.importError', { message: err.message ?? 'Unknown' }));
			}
			return false;
		}
		notifications.error($t$('wallet.importInvalid'));
		return false;
	}

	async function handleClose() {
		open = false;
		exportedPassword = '';
		sourceMasterPassword = '';
		showSourceMasterPassword = false;
		importData = '';
		previewStatus = 'idle';
		previewItems = [];
		previewWalletCount = 0;
		previewAddCount = 0;
		previewRenameCount = 0;
		previewRequiresMigration = false;
	}
</script>

<Modal bind:open tt="wallet.importWallets" onClose={handleClose}>
	<form method="post">
		<ButtonSelect
			vertical={false}
			options={[
				{ id: 'file', name: '.krawlet File' },
				{ id: 'text', name: 'JSON Text (legacy)' }
			]}
			bind:selected={importType}
		/>
		<label>
			{$t$('wallet.exportedPassword')}
			<input
				type="password"
				name="exported-password"
				bind:value={exportedPassword}
				placeholder={$t$('wallet.importPasswordPlaceholder')}
			/>
		</label>
		<small>{$t$('wallet.importReencryptHelp')}</small>
		{#if showSourceMasterPassword}
			<label>
				{$t$('wallet.importSourceMasterPassword')}
				<input
					type="password"
					name="source-master-password"
					bind:value={sourceMasterPassword}
					placeholder={$t$('wallet.importSourceMasterPasswordPlaceholder')}
				/>
				<small>{$t$('wallet.importSourceMasterPasswordHelp')}</small>
			</label>
		{/if}
		{#if importType === 'file'}
			<label>
				{$t$('wallet.importFile')}
				<input
					type="file"
					name="import-file"
					accept=".krawlet,.json"
					onchange={async (e) => {
						const file = (e.target as HTMLInputElement).files?.[0];
						if (!file) return;
						importData = await file.text();
					}}
				/>
				<small>{$t$('wallet.importFileHelp')}</small>
			</label>
		{:else}
			<label>
				{$t$('wallet.importData')}
				<textarea
					rows="10"
					placeholder={$t$('wallet.importDataPlaceholder')}
					name="import-data"
					bind:value={importData}
				></textarea>
			</label>
		{/if}
		{#if previewStatus !== 'idle'}
			<section class="import-preview" aria-live="polite">
				<div class="preview-header">
					<strong>{$t$('wallet.importPreviewTitle')}</strong>
				</div>
				{#if previewStatus === 'awaiting-password'}
					<small>{$t$('wallet.importPreviewWaiting')}</small>
				{:else if previewStatus === 'validating'}
					<small>{$t$('wallet.importPreviewLoading')}</small>
				{:else if previewStatus === 'invalid'}
					<p class="fail">{$t$('wallet.importPreviewInvalid')}</p>
				{:else if previewStatus === 'empty'}
					<small>{$t$('wallet.importPreviewEmpty')}</small>
				{:else}
					<p class="success">{$t$('wallet.importPreviewReady', { count: previewWalletCount })}</p>
					<small
						>{$t$('wallet.importPreviewSummary', {
							add: previewAddCount,
							rename: previewRenameCount
						})}</small
					>
					{#if previewRequiresMigration}
						<small class="success">{$t$('wallet.importPreviewReencryptEnabled')}</small>
					{/if}
					<ul>
						{#each previewItems as item (`${item.address}-${item.action}`)}
							<li>
								<div class="item-row">
									<div>{item.name}</div>
									<span
										class:item-add={item.action === 'add'}
										class:item-rename={item.action === 'rename'}
									>
										{item.action === 'add'
											? $t$('wallet.importPreviewActionAdd')
											: $t$('wallet.importPreviewActionRename')}
									</span>
								</div>
								<small>{item.address}</small>
								{#if item.action === 'rename' && item.previousName && item.previousName !== item.name}
									<small>{$t$('wallet.importPreviewRenameFrom', { name: item.previousName })}</small
									>
								{/if}
							</li>
						{/each}
					</ul>
					{#if previewWalletCount > previewItems.length}
						<small>
							{$t$('wallet.importPreviewMore', { count: previewWalletCount - previewItems.length })}
						</small>
					{/if}
				{/if}
			</section>
		{/if}
		<Button
			variant="primary"
			type="submit"
			full={true}
			onClick={importWallets}
			icon={faFileImport}
			tk="wallet.importButton"
			disabled={previewStatus !== 'ready'}
		/>
	</form>
</Modal>

<style>
	.import-preview {
		margin: 0.85rem 0 1rem;
		padding: 0.85rem 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
	}

	.preview-header {
		margin-bottom: 0.35rem;
	}

	.import-preview p,
	.import-preview ul {
		margin: 0.4rem 0 0;
	}

	.import-preview ul {
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.55rem;
	}

	.import-preview li {
		padding: 0.55rem 0.7rem;
		border-radius: 0.6rem;
		background: rgba(0, 0, 0, 0.16);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.import-preview li div {
		font-weight: 500;
	}

	.item-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.item-row span {
		font-size: 0.76rem;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.16);
	}

	.item-add {
		color: rgb(var(--green));
		background: rgba(var(--green), 0.12);
		border-color: rgba(var(--green), 0.4) !important;
	}

	.item-rename {
		color: rgb(var(--blue));
		background: rgba(var(--blue), 0.12);
		border-color: rgba(var(--blue), 0.35) !important;
	}

	.import-preview small {
		color: var(--text-color-2);
	}
</style>
