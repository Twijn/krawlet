<script lang="ts">
	import Button from "../ui/Button.svelte";
	import Modal from "../ui/Modal.svelte";
	import settings, { encryptWithPassword } from "$lib/stores/settings";
    import { t$ } from "$lib/i18n";
	import ToggleCheckbox from "../form/ToggleCheckbox.svelte";
	import { slide } from "svelte/transition";
	import ButtonSelect from "../ui/ButtonSelect.svelte";
	import { masterPasswordStore } from "$lib/stores/masterPassword";
	import { notifications } from "$lib/stores/notifications";

    let {
        open = $bindable(false),
    }: {
        open: boolean;
    } = $props();

	let useMasterPassword = $state(true);

	let selectedExportOption = $state<"file"|"text">("file");

    let exportedPassword = $state('');
    let exportData = $state('');

	const EXPORT_FILE_EXTENSION = ".krawlet";
	const EXPORT_FILE_TYPE = "application/json";

	type SavePickerOptions = {
		suggestedName?: string;
		excludeAcceptAllOption?: boolean;
		types?: Array<{
			description?: string;
			accept: Record<string, string[]>;
		}>;
	};

	type SaveFileHandle = {
		createWritable: () => Promise<{
			write: (data: string) => Promise<void>;
			close: () => Promise<void>;
		}>;
	};

	type ExportDelivery = "saved" | "download-started";

	function getExportFileName() {
		const date = new Date().toISOString().slice(0, 10);
		return `krawlet-wallets-${date}${EXPORT_FILE_EXTENSION}`;
	}

	async function downloadExportFile(payload: string): Promise<ExportDelivery> {
		const fileName = getExportFileName();
		const globalWithSavePicker = globalThis as typeof globalThis & {
			showSaveFilePicker?: (options?: SavePickerOptions) => Promise<SaveFileHandle>;
		};

		if (globalWithSavePicker.showSaveFilePicker) {
			const handle = await globalWithSavePicker.showSaveFilePicker({
				suggestedName: fileName,
				excludeAcceptAllOption: true,
				types: [
					{
						description: "Krawlet Wallet Export",
						accept: {
							[EXPORT_FILE_TYPE]: [EXPORT_FILE_EXTENSION]
						}
					}
				]
			});

			const writable = await handle.createWritable();
			await writable.write(payload);
			await writable.close();
			return "saved";
		}

		const blob = new Blob([payload], { type: EXPORT_FILE_TYPE });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		link.remove();

		setTimeout(() => {
			URL.revokeObjectURL(url);
		}, 1000);

		return "download-started";
	}

	async function copyExportText(payload: string) {
		await navigator.clipboard.writeText(payload);
	}

    async function exportWallets(e: Event) {
		e.preventDefault();

		if (useMasterPassword) {
			exportedPassword = await masterPasswordStore.get();
		}

		if (!exportedPassword || exportedPassword.length < 6) {
			if (useMasterPassword) {
				notifications.error("You must authenticate with your master password to export using your master password.");
			} else {
				notifications.error("Export password is required and must be at least 6 characters long!");
			}
			return false;
		}

		exportData = await encryptWithPassword(exportedPassword, settings.export());

		if (selectedExportOption === "file") {
			try {
				const delivery = await downloadExportFile(exportData);
				if (delivery === "saved") {
					notifications.success("Wallet export saved.");
				} else {
					notifications.info("Wallet export download started.");
				}
			} catch (error) {
				if ((error as DOMException).name !== "AbortError") {
					console.error(error);
					notifications.error("Failed to download wallet export.");
				}
			}
		} else if (selectedExportOption === "text") {
			try {
				await copyExportText(exportData);
				notifications.success($t$('wallet.exportCopied'));
			} catch (error) {
				console.error(error);
				notifications.error("Failed to copy export data to clipboard.");
			}
		} else {
			notifications.error("Unknown export option");
		}

		handleClose();

		return false;
	}

    async function handleClose() {
        open = false;
		useMasterPassword = true;
		selectedExportOption = "file";
		exportedPassword = "";
		exportData = "";
    }

	const exportOptions = [
		{
			id: "file",
			name: ".krawlet File"
		},
		{
			id: "text",
			name: "JSON Text (legacy)"
		}
	];
</script>

<Modal
    bind:open={open}
    tt="wallet.exportWallets"
    onClose={handleClose}
>
    <form method="post">
		<ToggleCheckbox bind:checked={useMasterPassword}>
			Use master password as export password
		</ToggleCheckbox>
		{#if !useMasterPassword}
			<p>You can enter a new export password below to encrypt your wallets.</p>
			<label transition:slide={{duration: 200}}>
				{$t$('wallet.exportedPassword')}
				<input
					type="password"
					name="exported-password"
					bind:value={exportedPassword}
					placeholder={$t$('wallet.exportedPasswordPlaceholder')}
				/>
			</label>
		{:else}
			<p>We will use your master password to encrypt your wallets.</p>
		{/if}
		<p>After import, your current master password will continue to be required to decrypt your wallets.</p>
		<div class="padding">
			<ButtonSelect bind:selected={selectedExportOption} options={exportOptions} vertical={false} />
		</div>
		<Button
			variant="primary"
			type="submit"
			full={true}
			onClick={exportWallets}
			tk="wallet.exportButton"
		/>
    </form>
</Modal>

<style>
	.padding {
		margin: 0.5em 0;
	}

	p {
		color: var(--text-color-2);
		font-size: .9rem;
	}
</style>
