<script lang="ts">
	import type { Snippet } from 'svelte';

	type TagVariant = 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'purple';
	type TagSize = 'sm' | 'md';

	let {
		variant = 'gray',
		size = 'sm',
		uppercase = false,
		title,
		label,
		children
	}: {
		variant?: TagVariant;
		size?: TagSize;
		uppercase?: boolean;
		title?: string;
		label?: string;
		children?: Snippet;
	} = $props();
</script>

<span class="tag {variant} {size}" class:uppercase {title}>
	{#if children}
		{@render children()}
	{:else if label}
		{label}
	{/if}
</span>

<style>
	.tag {
		--tag-color: 255, 255, 255;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.2em 0.55em;
		border-radius: 999px;
		font-weight: 700;
		line-height: 1;
		border: 1px solid rgba(var(--tag-color), 0.28);
		background: rgba(var(--tag-color), 0.14);
		color: rgb(var(--tag-color));
	}

	.tag.sm {
		font-size: 0.72rem;
		letter-spacing: 0.03em;
	}

	.tag.md {
		font-size: 0.8rem;
		letter-spacing: 0.02em;
		padding: 0.3em 0.68em;
	}

	.tag.uppercase {
		text-transform: uppercase;
	}

	.tag :global(svg) {
		font-size: 0.9em;
	}

	.tag.gray {
		--tag-color: 255, 255, 255;
		color: rgba(255, 255, 255, 0.84);
		border-color: rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.06);
	}

	.tag.blue {
		--tag-color: var(--blue);
	}

	.tag.green {
		--tag-color: var(--green);
	}

	.tag.red {
		--tag-color: var(--red);
	}

	.tag.yellow {
		--tag-color: var(--yellow);
	}

	.tag.orange {
		--tag-color: var(--orange);
	}

	.tag.purple {
		--tag-color: var(--primary);
	}
</style>
