<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		legend,
		children
	}: {
		legend: Snippet;
		children: Snippet;
	} = $props();
</script>

<fieldset class="settings-group">
	<legend>{@render legend()}</legend>
	{@render children()}
</fieldset>

<style>
	.settings-group {
		margin-bottom: 0;
		padding: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
	}

	.settings-group legend {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		padding: 0 0.5rem;
	}

	.settings-group legend :global(svg) {
		width: 1rem;
		height: 1rem;
		opacity: 0.7;
	}

	@media (max-width: 768px) {
		.settings-group {
			padding: 0.75rem;
		}
	}
</style>
