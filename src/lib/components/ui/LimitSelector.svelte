<script lang="ts">
    type Props = {
        /** Current limit value */
        limit: number;
        /** Available options */
        options?: number[];
        /** Label text */
        label?: string;
    };

    let {
        limit = $bindable(30),
        options = [15, 30, 60, 90, 120],
        label = "Max per page:"
    }: Props = $props();
</script>

<label class="limit-selector">
    <span>{label}</span>
    <select name="limit" bind:value={limit}>
        {#each options as option (option)}
            <option value={option}>{option}</option>
        {/each}
    </select>
</label>

<style>
    .limit-selector {
        display: flex;
        align-items: center;
        flex-direction: row;
        gap: 0.5em;
    }

    select {
        display: inline;
        width: auto;
        padding: 0.5em;
        font-size: 0.95em;
    }
</style>
