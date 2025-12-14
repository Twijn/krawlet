<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { t$ } from '$lib/i18n';

	const {
		loading = $bindable(true),
		absolute = false,
		children
	}: {
		loading?: boolean;
		absolute?: boolean;
		children?: Snippet;
	} = $props();
</script>

{#if loading}
	<div class="loading" class:absolute transition:fade role="status" aria-label={$t$('common.loading')} aria-busy="true">
		{#if children}
			{@render children()}
		{:else}
			<div class="loading-content">
				<div class="spinner"></div>
				<div class="shimmer-bar"></div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.5rem 1rem;
		color: var(--text-color-2);
	}

	.loading.absolute {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		background-color: rgba(0, 0, 0, 0.3);
		color: var(--text-color-1);
		z-index: 10;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-top-color: rgba(var(--blue), 0.7);
		animation: spin 0.8s linear infinite;
	}

	.shimmer-bar {
		width: 60px;
		height: 3px;
		border-radius: 2px;
		background: linear-gradient(
			90deg,
			var(--background-color-2) 25%,
			rgba(var(--blue), 0.25) 50%,
			var(--background-color-2) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
