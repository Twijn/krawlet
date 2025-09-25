<script lang="ts">
	import { paramState } from "$lib/paramState.svelte";
	import { notifications } from "$lib/stores/notifications";

    let {
        metadata = $bindable(),
    }: {
        metadata: string,
    } = $props();

    let useCommonMeta = paramState("common_meta", false, {
        deserialize: (value: string) => value === "true",
        shouldSet: (value: boolean) => value,
    });

    // let parsed = $derived(kromer.transactions.parseMetadata(metadata));

    function toggleRaw() {
        notifications.warning("Not yet implemented!");
        // useCommonMeta.value = !useCommonMeta.value;
    }
</script>

<div class="meta-input">
    {#if useCommonMeta.value}
        <small>Not yet implemented!</small>
    {:else}
        <label>
            Raw Metadata
            <textarea name="raw-metadata" bind:value={metadata} placeholder="key=value;anotherkey=anothervalue"></textarea>
        </label>
    {/if}

    <button type="button" class="small" onclick={toggleRaw}>Switch to {useCommonMeta.value ? "Raw Metadata" : "CommonMeta"}</button>
</div>

<style>
    .meta-input {
        margin: .5em 0;
    }

    button {
        font-size: .9rem;
        background-color: transparent;
        color: var(--theme-color-2);
        border: none;
        margin: 0;
        padding: 0;
        cursor: pointer;
    }

    button:hover,
    button:focus-visible {
        text-decoration: underline;
    }
</style>
