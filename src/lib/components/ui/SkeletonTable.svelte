<!--
  @component SkeletonTable

  A generic skeleton loader that mimics a table layout.
  Use this when loading tabular data.

  @prop {number} rows - Number of table rows to show
  @prop {number} columns - Number of columns per row

  @example
  <SkeletonTable rows={5} columns={4} />
-->
<script lang="ts">
	import { t$ } from '$lib/i18n';

	type Props = {
		rows?: number;
		columns?: number;
	};

	const { rows = 5, columns = 4 }: Props = $props();

	// Generate varying widths for more natural look
	function getWidth(columnIndex: number, rowIndex: number): string {
		const baseWidths = ['80%', '100%', '60%', '90%', '70%'];
		const index = (columnIndex + rowIndex) % baseWidths.length;
		return baseWidths[index];
	}
</script>

<div class="skeleton-table" role="status" aria-label={$t$('common.loading')} aria-busy="true">
	<!-- Header -->
	<div class="skeleton-header-row">
		{#each Array.from({ length: columns }, (_, i) => i) as col (col)}
			<div class="skeleton-header-cell">
				<div class="skeleton-bar header" style:width="70%"></div>
			</div>
		{/each}
	</div>

	<!-- Body rows -->
	{#each Array.from({ length: rows }, (_, i) => i) as row (row)}
		<div class="skeleton-row">
			{#each Array.from({ length: columns }, (_, i) => i) as col (col)}
				<div class="skeleton-cell">
					<div class="skeleton-bar" style:width={getWidth(col, row)}></div>
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.skeleton-table {
		width: 100%;
	}

	.skeleton-header-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 1rem;
		padding: 0.8rem 0.6rem;
		background-color: rgba(0, 0, 0, 0.1);
		border-bottom: 0.1em solid var(--theme-color-1);
	}

	.skeleton-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 1rem;
		padding: 0.8rem 0.6rem;
		border-bottom: 0.1em solid rgba(255, 255, 255, 0.1);
	}

	.skeleton-row:last-child {
		border-bottom: none;
	}

	.skeleton-header-cell,
	.skeleton-cell {
		display: flex;
		align-items: center;
	}

	.skeleton-bar {
		height: 1em;
		background: linear-gradient(
			90deg,
			var(--background-color-2) 25%,
			rgba(var(--blue), 0.1) 50%,
			var(--background-color-2) 75%
		);
		background-size: 200% 100%;
		border-radius: 0.25rem;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-bar.header {
		height: 0.9em;
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
