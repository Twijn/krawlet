<script lang="ts">
	import type { Snippet } from 'svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = null,
		mdCols = null,
		smCols = null,
		title,
		headerActions,
		children
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		title?: Snippet;
		headerActions?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section
	class="{lgCols ? `col-${lgCols}` : ''} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''}"
>
	{#if title || headerActions}
		<header>
			{#if title}
				<h2>{@render title()}</h2>
			{/if}
			{#if headerActions}
				<div class="header-actions">
					{@render headerActions()}
				</div>
			{/if}
		</header>
	{/if}
	{@render children()}
</section>

<style>
	section {
		position: relative;
		background-color: rgba(12, 29, 39, 0.96);
		padding: 1rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
		transition:
			box-shadow 0.2s ease,
			border-color 0.2s ease,
			background-color 0.2s ease;
	}

	section:hover {
		border-color: rgba(255, 255, 255, 0.12);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
		background-color: rgba(13, 31, 42, 0.98);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0 0 0.75rem 0;
		margin: 0 0 1rem 0;
		border-bottom: 1px solid rgba(var(--theme-color-rgb), 0.8);
	}

	header h2 {
		font-size: 1.15rem;
		font-weight: 600;
		line-height: 1.2;
		margin: 0;
		letter-spacing: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	section > :global(h2),
	section > :global(h3),
	section > :global(h4),
	section > :global(h5),
	section > :global(h6) {
		font-size: 1.15rem;
		font-weight: 600;
		line-height: 1.2;
		padding: 0 0 0.75rem 0;
		margin: 0 0 1rem 0;
		border-bottom: 1px solid rgba(var(--theme-color-rgb), 0.8);
	}

	@media only screen and (max-width: 768px) {
		section {
			padding: 0.75rem;
		}

		header {
			padding: 0 0 0.625rem 0;
			margin: 0 0 0.75rem 0;
			flex-wrap: wrap;
			gap: 0.75rem;
		}

		section > :global(h2),
		section > :global(h3),
		section > :global(h4),
		section > :global(h5),
		section > :global(h6) {
			padding: 0 0 0.625rem 0;
			margin: 0 0 0.75rem 0;
		}
	}
</style>
