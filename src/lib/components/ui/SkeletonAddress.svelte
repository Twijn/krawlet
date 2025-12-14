<!--
  @component SkeletonAddress

  A skeleton loader that mimics the layout of an address card.
  Use this when loading address data.

  @prop {number} rows - Number of address skeleton cards to show

  @example
  <SkeletonAddress rows={3} />
-->
<script lang="ts">
	import { t$ } from '$lib/i18n';

	type Props = {
		rows?: number;
	};

	const { rows = 3 }: Props = $props();
</script>

<div class="skeleton-addresses" role="status" aria-label={$t$('common.loading')} aria-busy="true">
	{#each Array.from({ length: rows }, (_, i) => i) as i (i)}
		<div class="skeleton-address">
			<div class="skeleton-header">
				<div class="skeleton-avatar"></div>
				<div class="skeleton-info">
					<div class="skeleton-bar name"></div>
					<div class="skeleton-bar address"></div>
				</div>
			</div>
			<div class="skeleton-stats">
				<div class="skeleton-stat">
					<div class="skeleton-bar label"></div>
					<div class="skeleton-bar value"></div>
				</div>
				<div class="skeleton-stat">
					<div class="skeleton-bar label"></div>
					<div class="skeleton-bar value"></div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.skeleton-addresses {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.skeleton-address {
		background-color: var(--background-color-1);
		border-radius: 0.5rem;
		padding: 1rem;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.15);
	}

	.skeleton-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.skeleton-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(
			90deg,
			var(--background-color-2) 25%,
			rgba(var(--blue), 0.1) 50%,
			var(--background-color-2) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		flex-shrink: 0;
	}

	.skeleton-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	.skeleton-bar.name {
		width: 150px;
	}

	.skeleton-bar.address {
		width: 200px;
	}

	.skeleton-bar.label {
		width: 60px;
		height: 0.75em;
	}

	.skeleton-bar.value {
		width: 100px;
	}

	.skeleton-stats {
		display: flex;
		gap: 2rem;
	}

	.skeleton-stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
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
