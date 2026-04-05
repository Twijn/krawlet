<script lang="ts">
	import ButtonSelect from "$lib/components/ui/ButtonSelect.svelte";
	import Section from "$lib/components/ui/Section.svelte";
	import { faSignature } from "@fortawesome/free-solid-svg-icons";
	import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
	import AddressSelector from "../addresses/AddressSelector.svelte";
    import { t$ } from "$lib/i18n";
	import kromer from "$lib/api/kromer";
	import { notifications } from "$lib/stores/notifications";
	import ModuleLoading from "../other/ModuleLoading.svelte";
	import Alert from "$lib/components/dialogs/Alert.svelte";
	import Button from "$lib/components/ui/Button.svelte";
    import { confirm } from "$lib/stores/confirm";
    import type { APIError } from "kromer";

    let selectedOption = $state<"purchase"|"transfer"|"update">("purchase");
    const options = [
        { name: "Purchase New", id: "purchase" },
        { name: "Transfer Existing", id: "transfer" },
        { name: "Update A Data", id: "update" }
    ];

    let loading = $state(false);
	let privatekey = $state('');
	let address = $state('');

	let allNames: { id: string; name: string; a?: string }[] = $state([]);
	let selectedName = $state('');

    let toAddress = $state('');
    let newData = $state('');
    let nameCost = $state(500);

    const normalizedPurchaseName = $derived(selectedName.trim().replace(/\.kro$/i, ''));

    function updateData() {
        if (selectedName) {
            const nameInfo = allNames.find(x => x.id === selectedName);
            if (nameInfo && nameInfo.a) {
                newData = nameInfo.a;
            }
        }
    }

    function updateNames() {
		loading = true;
		const address = kromer.addresses.decodeAddressFromPrivateKey(privatekey);
		kromer.addresses.getNames(address).then(
			(names) => {
				allNames = names.names.map((n) => ({ id: n.name, name: n.name + '.kro', a: n.a }));
			},
			(e) => {
				console.error(e);
				allNames = [];
				notifications.error(`Failed to retrieve names for address ${address}`);
			}
		).finally(() => {
            loading = false;
        });
	}

	$effect(() => {
		if (privatekey === '') {
			allNames = [];
			return;
		}

        kromer.names.getCost().then((cost) => {
            nameCost = cost;
        });

		updateNames();
	});

    const canSubmit = $derived<boolean>(
        selectedOption === "purchase" ? privatekey.trim() !== '' && normalizedPurchaseName !== '' :
        selectedOption === "transfer" ? privatekey.trim() !== '' && selectedName.trim() !== '' && toAddress.trim().length === 10 :
        selectedOption === "update" ? privatekey.trim() !== '' && selectedName.trim() !== '' :
        false
    );
    const canSubmitMessage = $derived<string>(
        selectedOption === "purchase"
            ? (privatekey.trim() === ''
                ? $t$('name.selectPrivateKeyHint')
                : normalizedPurchaseName === ''
                    ? $t$('name.namePlaceholder')
                    : '')
            : selectedOption === "transfer"
                ? (privatekey.trim() === ''
                    ? $t$('name.selectPrivateKeyHint')
                    : selectedName.trim() === ''
                        ? $t$('name.selectNameToTransfer')
                        : toAddress.trim().length !== 10
                            ? $t$('name.invalidRecipientAddress')
                            : '')
                : selectedOption === "update"
                    ? (privatekey.trim() === ''
                        ? $t$('name.selectPrivateKeyHint')
                        : selectedName.trim() === ''
                            ? $t$('name.selectNameToUpdate')
                            : '')
                    : ""
    );

    function submitNameAction(e: Event) {
        e.preventDefault();

        if (!canSubmit) {
            notifications.warning(canSubmitMessage || $t$('common.error'));
            return;
        }

        if (selectedOption === 'purchase') {
            const name = normalizedPurchaseName;
            confirm.confirm({
                message: $t$('name.confirmPurchase', { name, cost: nameCost }),
                confirmButtonLabel: $t$('name.purchaseButton'),
                confirm: () => {
                    loading = true;
                    kromer.names
                        .register(name, { privatekey })
                        .then(
                            () => {
                                notifications.success($t$('name.purchaseSuccess'));
                                selectedName = '';
                            },
                            (err) => {
                                const apiError = err as APIError;
                                notifications.error(
                                    $t$('name.purchaseFailed', { message: apiError.message || 'Unknown error' })
                                );
                            }
                        )
                        .finally(() => {
                            loading = false;
                        });
                },
                cancel: () => {
                    notifications.warning($t$('name.purchaseCancelled'));
                }
            });
            return;
        }

        if (selectedOption === 'transfer') {
            confirm.confirm({
                message: $t$('name.confirmTransfer', { name: selectedName, address: toAddress.trim() }),
                confirmButtonLabel: $t$('name.transferButton'),
                danger: true,
                confirm: () => {
                    loading = true;
                    kromer.names
                        .transfer(selectedName, { privatekey, address: toAddress.trim() })
                        .then(
                            () => {
                                notifications.success($t$('name.transferSuccess'));
                                selectedName = '';
                                toAddress = '';
                                updateNames();
                            },
                            (err) => {
                                const apiError = err as APIError;
                                notifications.error(
                                    $t$('name.transferFailed', { message: apiError.message || 'Unknown error' })
                                );
                            }
                        )
                        .finally(() => {
                            loading = false;
                        });
                }
            });
            return;
        }

        confirm.confirm({
            message: $t$('name.confirmUpdate', {
                name: selectedName,
                data: newData && newData.length > 0 ? newData : $t$('name.nullValue')
            }),
            confirmButtonLabel: $t$('name.updateButton'),
            danger: true,
            confirm: () => {
                loading = true;
                kromer.names
                    .update(selectedName, { privatekey, a: newData })
                    .then(
                        () => {
                            notifications.success($t$('name.updateSuccess'));
                            selectedName = '';
                            updateNames();
                        },
                        (err) => {
                            const apiError = err as APIError;
                            notifications.error(
                                $t$('name.updateFailed', { message: apiError.message || 'Unknown error' })
                            );
                        }
                    )
                    .finally(() => {
                        loading = false;
                    });
            }
        });
    }
</script>

<Section lgCols={6} mdCols={12}>
    <h2><FontAwesomeIcon icon={faSignature} /> Manage Names</h2>
    <ModuleLoading bind:loading absolute />
    
    <ButtonSelect {options} vertical={false} bind:selected={selectedOption} />

    <AddressSelector
        mode="privatekey"
        bind:privatekey bind:address
        label={$t$('address.address')}
    />
    
    {#if ["transfer", "update"].includes(selectedOption)}
        {#if allNames.length > 0}
            <label>
                {$t$('name.name')}
                <ButtonSelect vertical bind:options={allNames} bind:selected={selectedName} change={updateData} />
            </label>
        {:else if privatekey.length > 0 || loading}
            <Alert variant="danger">{$t$('name.noOwnedNames')}</Alert>
        {:else}
            <Alert variant="info">{$t$('name.selectPrivateKeyHint')}</Alert>
        {/if}
    {:else if selectedOption === "purchase"}
        <label>
            {$t$('name.name')}
                <input type="text" placeholder={$t$('name.namePlaceholder')} bind:value={selectedName} />
        </label>
    {/if}

    {#if selectedOption === "transfer"}
        <AddressSelector
            mode="address"
            label={$t$('transaction.recipient')}
            bind:address={toAddress}
        />
    {:else if selectedOption === "update"}
        <label>
            {$t$('name.dataField')}
            <input type="text" bind:value={newData} />
        </label>
    {/if}

    <Button
        full
        variant="primary"
        disabled={!canSubmit}
        loading={loading}
        title={!canSubmit ? canSubmitMessage : undefined}
        onClick={submitNameAction}
    >
        {#if selectedOption === "purchase"}
            {$t$('name.purchaseButton')}
        {:else if selectedOption === "transfer"}
            {$t$('name.transferButton')}
        {:else if selectedOption === "update"}
            {$t$('name.updateButton')}
        {/if}
    </Button>
</Section>
