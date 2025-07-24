<script lang="ts">
	export let href: string | undefined = undefined;
	export let newTab: boolean = false;
	export let variant: 'primary' | 'secondary' | 'success' | 'error' = 'primary';
	export let onClick: ((e: Event) => void|boolean|Promise<boolean>) | undefined = undefined;
	export let full: boolean = false;
	export let type: "button" | "submit" | "reset" = "button";
	export let disabled: boolean = false;
	export let external: boolean = false;
</script>

{#if href}
	<a {href} class="button {variant}" class:disabled class:full target={newTab ? "_blank" : undefined} rel={external ? 'external' : undefined}>
		<slot/>
	</a>
{:else}
	<button on:click={onClick} type={type} class="button {variant}" {disabled} class:full>
		<slot/>
	</button>
{/if}

<style>
    .button {
        box-sizing: border-box;
        font-family: var(--body-font-family), monospace;
        color: var(--primary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5em 1em;
        border-radius: 0.375em;
        font-size: 1rem;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
    }

    .button :global(i) {
        margin-right: .5em;
    }

    .primary {
        background-color: var(--theme-color-1);
    }

    .secondary {
        background-color: #2b2b2b;
        color: #e4e4e4;
    }

    .success {
        background-color: rgb(var(--green));
        color: white;
    }

    .error {
        background-color: rgb(var(--red));
        color: white;
    }

    .button:hover:not(.disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
    }

    .button:active:not(.disabled) {
        transform: translateY(0);
    }

    .disabled, .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .full {
        width: 100%;
    }
</style>
