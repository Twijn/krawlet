<script lang="ts">
	let { checked = $bindable(false), children, disabled = false, center = false } = $props();
</script>

<div class:center={center}>
	<label class="toggle-container">
		<input
			type="checkbox"
			bind:checked={checked}
			{disabled}
		/>
		<span class="slider"></span>
		{@render children?.()}
	</label>
</div>

<style>
    .toggle-container {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5em;
        cursor: pointer;
        user-select: none;
    }

    .center {
        display: flex;
        justify-content: center;
        width: 100%;
    }

    input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: relative;
        display: inline-block;
        flex-shrink: 0;
        width: 3em;
        height: 1.5em;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 1em;
        transition: 0.2s all ease-in-out;
    }

    .slider::before {
        content: '';
        position: absolute;
        height: 1.2em;
        width: 1.2em;
        left: 0.15em;
        bottom: 0.15em;
        background-color: var(--text-color-1);
        border-radius: 50%;
        transition: 0.2s all ease-in-out;
    }

    input:checked + .slider {
        background-color: var(--theme-color-1);
    }

    input:checked + .slider::before {
        transform: translateX(1.5em);
    }

    input:disabled + .slider {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>