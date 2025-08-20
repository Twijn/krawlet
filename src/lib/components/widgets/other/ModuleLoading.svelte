<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSpinner } from '@fortawesome/free-solid-svg-icons';
	import { fade } from 'svelte/transition';

	const {
		loading = $bindable(true),
		absolute = false
	}: {
		loading?: boolean;
		absolute?: boolean;
	} = $props();
</script>

{#if loading}
	<div class="loading" class:absolute transition:fade>
		<FontAwesomeIcon icon={faSpinner} spin />
		<span>Loading...</span>
	</div>
{/if}

<style>
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		color: var(--text-color-2);
	}

	.loading.absolute {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		background-color: rgba(0, 0, 0, 0.25);
		color: var(--text-color-1);
	}

	.loading :global(svg) {
		font-size: 1.2em;
	}
</style>
