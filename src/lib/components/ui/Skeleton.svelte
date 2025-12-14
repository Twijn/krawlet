<!--
  @component Skeleton

  A versatile skeleton loading component for displaying placeholder content
  while data is being fetched.

  @prop {'text' | 'circular' | 'rectangular'} variant - Shape of the skeleton
  @prop {string} width - CSS width value
  @prop {string} height - CSS height value
  @prop {number} lines - Number of text lines (for text variant)
  @prop {boolean} animate - Whether to show shimmer animation

  @example
  <Skeleton variant="text" lines={3} />
  <Skeleton variant="circular" width="48px" height="48px" />
  <Skeleton variant="rectangular" width="100%" height="200px" />
-->
<script lang="ts">
	import { t$ } from '$lib/i18n';

	type Props = {
		variant?: 'text' | 'circular' | 'rectangular';
		width?: string;
		height?: string;
		lines?: number;
		animate?: boolean;
	};

	const {
		variant = 'text',
		width = '100%',
		height = '1em',
		lines = 1,
		animate = true
	}: Props = $props();
</script>

<div
	class="skeleton-wrapper {variant}"
	class:animate
	style:width
	style:height={variant !== 'text' || lines === 1 ? height : 'auto'}
	role="status"
	aria-label={$t$('common.loading')}
	aria-busy="true"
>
	{#if variant === 'text' && lines > 1}
		{#each Array.from({ length: lines }, (_, i) => i) as i (i)}
			<div class="skeleton-line" style:width={i === lines - 1 ? '70%' : '100%'}></div>
		{/each}
	{:else}
		<span class="sr-only">{$t$('common.loading')}</span>
	{/if}
</div>

<style>
	.skeleton-wrapper {
		background: linear-gradient(
			90deg,
			var(--background-color-2) 25%,
			rgba(var(--blue), 0.1) 50%,
			var(--background-color-2) 75%
		);
		background-size: 200% 100%;
		border-radius: 0.25rem;
	}

	.skeleton-wrapper.animate {
		animation: shimmer 1.5s infinite;
	}

	.skeleton-wrapper.circular {
		border-radius: 50%;
	}

	.skeleton-wrapper.text {
		background: transparent;
	}

	.skeleton-line {
		height: 1em;
		margin-bottom: 0.5em;
		background: linear-gradient(
			90deg,
			var(--background-color-2) 25%,
			rgba(var(--blue), 0.1) 50%,
			var(--background-color-2) 75%
		);
		background-size: 200% 100%;
		border-radius: 0.25rem;
	}

	.skeleton-wrapper.animate .skeleton-line {
		animation: shimmer 1.5s infinite;
	}

	.skeleton-line:last-child {
		margin-bottom: 0;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
