<script lang="ts">
	import { faFileImport } from "@fortawesome/free-solid-svg-icons";
	import Button from "../ui/Button.svelte";
	import Modal from "../ui/Modal.svelte";
	import settings, { decryptWithPassword } from "$lib/stores/settings";
    import { t$ } from "$lib/i18n";
	import { get } from "svelte/store";
	import { notifications } from "$lib/stores/notifications";
	import type { APIError } from "kromer";

    let {
        open = $bindable(false),
    }: {
        open: boolean;
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
				notifications.error($t$('wallet.importError', { message: err.message ?? "Unknown" }));
			}
			return false;
		}
		notifications.error($t$('wallet.importInvalid'));
		return false;

        return false;
    }

    async function handleClose() {
        open = false;
    }
</script>

<Modal
    bind:open={open}
    tt="wallet.importWallets"
    onClose={handleClose}
>
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
        <Button
            variant="primary"
            type="submit"
            full={true}
            onClick={importWallets}
            icon={faFileImport}
            tk="wallet.importButton"
        />
    </form>
</Modal>
