<script lang="ts">
	import playerWallets, { type Player } from "$lib/stores/playerWallets";
    import knownAddresses, { type KnownAddress } from "$lib/stores/knownAddresses";
	import type { Wallet } from "$lib/stores/settings";
	import settings from "$lib/stores/settings";
	import AddressComp from "./Address.svelte";
	import { formatCurrency } from "$lib/util";
	import kromer from "$lib/api/kromer";
	import ModuleLoading from "../other/ModuleLoading.svelte";
	import { faBuilding, faCheck, faDice, faStore, faWallet, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
	import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";

    const NAME_REGEX = /(\w+@)?(\w+)(\.kro)?/;

    const PER_FILTER_LIMIT = 5;

    let {
        label,
        mode = "address",
        query = $bindable(""),
        privatekey = $bindable(),
        address = $bindable(""),
        balances = $bindable({}),
    }: {
        label: string;
        mode?: "address"|"privatekey";
        query?: string;
        privatekey?: string;
        address?: string;
        balances?: Record<string, number>;
    } = $props();

    type Addr = Wallet|Player|KnownAddress;

    let allAddresses: Addr[] = $derived([
        ...$settings.wallets,
        ...$playerWallets.data,
        ...$knownAddresses.data,
    ]);

    let loading: boolean = $state(false);

    let selected: Addr|null = $state(null);

    let balance: number|null = $derived(
        selected ? (balances[getAddress(selected)] ?? null) : null
    );

    let filteredAddresses: Addr[] = $derived(
        allAddresses.filter(addr => {
            const q = query.toLowerCase();
            const address = 'address' in addr ? addr.address : addr.kromerAddress;
            if ('name' in addr && addr.name.toLowerCase().includes(q)) {
                return true;
            } else if (address.toLowerCase().includes(q)) {
                return true;
            } else if ('minecraftName' in addr && addr.minecraftName.toLowerCase().includes(q)) {
                return true;
            }
            return false;
        })
    );

    let filteredWallets: Wallet[] = $derived(
        filteredAddresses.filter((a) => 'private' in a).slice(0, PER_FILTER_LIMIT)
    );
    let filteredPlayers: Player[] = $derived(
        filteredAddresses.filter((a) => 'minecraftUUID' in a).slice(0, PER_FILTER_LIMIT)
    );
    let filteredKnown: KnownAddress[] = $derived(
        filteredAddresses.filter((a) => 'id' in a).slice(0, PER_FILTER_LIMIT)
    );

    function getAddress(addr: Addr): string {
        return 'address' in addr ? addr.address : addr.kromerAddress;
    }

    function setAddress(addr: Addr) {
        selected = addr;
        address = getAddress(addr);
        query = address;
    }

    function handleKeyUp(e: KeyboardEvent) {
        if (e.key === "Enter" && filteredAddresses.length === 1) {
            setAddress(filteredAddresses[0]);
        } else if (query !== address) {
            selected = null;
            address = "";
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    }

    $effect(() => {
        const addresses = [
            ...filteredWallets.map(x => x.address),
            ...filteredPlayers.map(x => x.kromerAddress),
            ...filteredKnown.map(x => x.address),
        ].filter(x => !balances.hasOwnProperty(x));
        
        if (addresses.length > 0) {
            loading = true;
            kromer.addresses.getMultiple(addresses).then(addrs => {
                for (const [address, addressObj] of Object.entries(addrs)) {
                    balances[address] = addressObj.balance;
                }
                loading = false;
            });
        }
    });

    function getVerifiedIcon(addr: KnownAddress): IconDefinition|null {
        switch (addr.type) {
            case "shop":
                return faStore;
            case "gamble":
                return faDice;
            case "company":
                return faBuilding;
            default:
                return faCheck;
        }
    }
</script>

<div class="address-selector">
    <ModuleLoading bind:loading absolute={true} />
    <label>
        {label}
        <input type="text" name="query-{label.toLowerCase()}" placeholder="Search for addresses..." bind:value={query} onkeyup={handleKeyUp} onkeydown={handleKeyDown}>
    </label>
    {#if selected}
        {@const type = 'private' in selected ? "wallet" : ("type" in selected ? selected.type : "address")}
        {@const address = getAddress(selected)}
        <div class="detail">
            <div class="selected">
                <strong class="caps">{type}:</strong>
                <AddressComp {address} />
            </div>
            {#if typeof(balance) === "number"}
                <span class="balance">{formatCurrency(balance)} <small>KRO</small></span>
            {/if}
        </div>
    {/if}
    <ul class="dropdown">
        {#if filteredWallets.length > 0}
            <li><strong>Wallets</strong></li>
            {#each filteredWallets as addr (addr.name + "." + addr.address)}
                {@const address = getAddress(addr)}
                <li>
                    <button type="button" onclick={() => setAddress(addr)}>
                        <FontAwesomeIcon icon={faWallet} />
                        <span class="bold-500">{addr.name}</span>
                        <small>({address})</small>
                        {#if typeof(balances[address]) === "number"}
                            <span class="right">{formatCurrency(balances[address])} <small>KRO</small></span>
                        {/if}
                    </button>
                </li>
            {/each}
        {/if}
        {#if mode === "address"}
            {#if filteredPlayers.length > 0}
                <li><strong>Players</strong></li>
                {#each filteredPlayers as addr (addr.kromerAddress)}
                    {@const address = getAddress(addr)}
                    <li>
                        <button type="button" onclick={() => setAddress(addr)}>
                            <img
                                src="https://api.mineatar.io/face/{addr.minecraftUUID}"
                                alt="Avatar for {addr.minecraftName}"
                            />
                            <span class="bold-500">{addr.minecraftName}</span>
                            <small>({address})</small>
                            {#if typeof(balances[address]) === "number"}
                                <span class="right">{formatCurrency(balances[address])} <small>KRO</small></span>
                            {/if}
                        </button>
                    </li>
                {/each}
            {/if}
            {#if filteredKnown.length > 0}
                <li><strong>Shops &amp; Verified</strong></li>
                {#each filteredKnown as addr (addr.address)}
                    {@const address = getAddress(addr)}
                    {@const icon = getVerifiedIcon(addr)}
                    <li>
                        <button type="button" onclick={() => setAddress(addr)}>
                            {#if 'imageSrc' in addr && addr.imageSrc}
                                <img src={addr.imageSrc} alt="Icon for {addr.name}" />
                            {:else if icon}
                                <FontAwesomeIcon {icon} />
                            {/if}
                            <span class="bold-500">{addr.name}</span>
                            <small>({address})</small>
                            {#if typeof(balances[address]) === "number"}
                                <span class="right">{formatCurrency(balances[address])} <small>KRO</small></span>
                            {/if}
                        </button>
                    </li>
                {/each}
            {/if}
        {/if}
    </ul>
</div>

<style>
    .address-selector {
        position: relative;
    }

    .dropdown {
        background-color: var(--background-color-1);
        position: absolute;
        top: calc(100% + .5em);
        left: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        list-style-type: none;
        border-radius: .25em;
        box-shadow: 2px 2px 16px rgba(0,0,0,0.5);
        z-index: 100;
        overflow: hidden auto;
        max-height: 20em;
        opacity: 0;
        transform: translateY(-10px) scaleY(0.9);
        pointer-events: none;
        transition: opacity 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1);
    }

    .address-selector:focus-within .dropdown {
        opacity: 1;
        transform: translateY(0) scaleY(1);
        pointer-events: auto;
    }

    .dropdown strong {
        display: block;
        color: var(--text-color-2);
        font-size: .8em;
        font-weight: 600;
        text-transform: uppercase;
        padding: .6em .5em;
        text-align: center;
    }

    .dropdown button {
        display: flex;
        align-items: center;
        gap: .35em;
        width: 100%;
        background-color: transparent;
        border: none;
        font-size: 1rem;
        padding: .6em .75em;
        cursor: pointer;
        text-align: left;
        transition: .25s background-color;
    }

    .dropdown button img {
        width: .8em;
        height: .8em;
        border-radius: .2em;
    }

    .dropdown button .right {
        flex-grow: 1;
    }

    .dropdown button:hover,
    .dropdown button:focus-visible {
        background-color: rgba(0,0,0,0.2);
    }

    .dropdown button :global(svg) {
        opacity: .5;
    }

    .detail {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>
