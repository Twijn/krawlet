<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faClose } from '@fortawesome/free-solid-svg-icons';
	import { t$ } from '$lib/i18n';
	import type { Snippet } from 'svelte';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	type Props = {
		/** Chip label */
		label?: string;
		/** Chip value to display */
		value?: string;
		/** CSS color variable (e.g., 'var(--theme-color-rgb)') */
		color?: string;
		/** Whether the chip can be removed */
		removable?: boolean;
		/** Called when remove button is clicked */
		onRemove?: () => void;
		/** Custom content instead of label/value */
		children?: Snippet;
	};

	let {
		label,
		value,
		color = 'var(--theme-color-rgb)',
		removable = true,
		onRemove,
		children
	}: Props = $props();
</script>

<span
	class="chip"
	style="--chip-color: {color}"
	transition:scale={{ duration: 200, easing: backOut, start: 0.85 }}
>
	{#if children}
		{@render children()}
	{:else}
		{#if label}
			<strong>{label}:</strong>
		{/if}
		{#if value}
			{value}
		{/if}
	{/if}
	{#if removable && onRemove}
		<button type="button" aria-label={$t$('common.delete')} onclick={onRemove}>
			<FontAwesomeIcon icon={faClose} />
		</button>
	{/if}
</span>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.35em 0.75em;
		border-radius: 2em;
		background: rgba(var(--chip-color), 0.12);
		color: rgb(var(--chip-color));
		border: 1px solid rgba(var(--chip-color), 0.25);
		font-size: 0.85em;
		font-weight: 500;
		transition: all 0.2s ease;
		backdrop-filter: blur(4px);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.chip:hover {
		background: rgba(var(--chip-color), 0.18);
		border-color: rgba(var(--chip-color), 0.4);
		box-shadow: 0 2px 6px rgba(var(--chip-color), 0.15);
	}

	.chip strong {
		font-weight: 600;
		opacity: 0.85;
	}

	.chip button {
		background: none;
		border: none;
		color: rgb(var(--chip-color));
		cursor: pointer;
		padding: 0.15em;
		margin: -0.15em -0.25em -0.15em 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.15s ease;
		opacity: 0.7;
	}

	.chip button:hover {
		opacity: 1;
		background: rgba(var(--chip-color), 0.2);
		transform: scale(1.1);
	}

	.chip button:active {
		transform: scale(0.95);
	}
</style>
