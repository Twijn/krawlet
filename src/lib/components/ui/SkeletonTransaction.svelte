<!--
  @component SkeletonTransaction

  A skeleton loader that mimics the layout of a transaction row.
  Use this when loading transaction data.

  @prop {number} rows - Number of transaction skeleton rows to show

  @example
  <SkeletonTransaction rows={5} />
-->
<script lang="ts">
	import { t$ } from '$lib/i18n';

	type Props = {
		rows?: number;
	};

	const { rows = 3 }: Props = $props();
</script>

<div
	class="skeleton-transactions"
	role="status"
	aria-label={$t$('common.loading')}
	aria-busy="true"
>
	{#each Array.from({ length: rows }, (_, i) => i) as i (i)}
		<div class="skeleton-transaction">
			<div class="skeleton-cell id">
				<div class="skeleton-bar"></div>
			</div>
			<div class="skeleton-cell from">
				<div class="skeleton-bar"></div>
			</div>
			<div class="skeleton-cell to">
				<div class="skeleton-bar"></div>
			</div>
			<div class="skeleton-cell amount">
				<div class="skeleton-bar"></div>
			</div>
			<div class="skeleton-cell date">
				<div class="skeleton-bar"></div>
			</div>
		</div>
	{/each}
</div>

<style>
	.skeleton-transactions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.skeleton-transaction {
		display: grid;
		grid-template-columns: 80px 1fr 1fr 100px 120px;
		gap: 1rem;
		padding: 0.8rem 0.6rem;
		border-bottom: 0.1em solid rgba(255, 255, 255, 0.1);
	}

	.skeleton-cell {
		display: flex;
		align-items: center;
	}

	.skeleton-bar {
		height: 1em;
		width: 100%;
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

	.skeleton-cell.id .skeleton-bar {
		width: 60px;
	}

	.skeleton-cell.amount .skeleton-bar {
		width: 80px;
	}

	.skeleton-cell.date .skeleton-bar {
		width: 100px;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (max-width: 768px) {
		.skeleton-transaction {
			grid-template-columns: 1fr 1fr;
		}

		.skeleton-cell.id,
		.skeleton-cell.date {
			display: none;
		}
	}
</style>
