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
		background-color: var(--background-color-2);
		padding: 1rem;
		border-radius: 0.75rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
		transition: box-shadow 0.2s ease;
	}

	section:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		margin: -1rem -1rem 1.25rem -1rem;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.1) 100%);
		border-radius: 0.75rem 0.75rem 0 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	header h2 {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		margin: 0;
		letter-spacing: 0.05em;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	:global(section > h2, section > h3, section > h4, section > h5, section > h6) {
		font-size: 0.95rem;
		font-weight: 500;
		text-transform: uppercase;
		padding: 0.8rem 1rem;
		margin: -1rem -1rem 1rem -1rem;
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem 0.5rem 0 0;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.2) inset;
	}

	@media only screen and (max-width: 768px) {
		section {
			padding: 0.75rem;
		}

		header {
			padding: 0.75rem;
			margin: -0.75rem -0.75rem 0.75rem -0.75rem;
			flex-wrap: wrap;
		}

		:global(section > h2, section > h3, section > h4, section > h5, section > h6) {
			padding: 0.75rem 0.75rem;
			margin: -0.75rem -0.75rem 0.75rem -0.75rem;
		}
	}
</style>
