<!--
  @component SkeletonWallet

  A skeleton loader that mimics the layout of a wallet card.
  Use this when loading wallet data.

  @prop {number} rows - Number of wallet skeleton cards to show

  @example
  <SkeletonWallet rows={2} />
-->
<script lang="ts">
	import { t$ } from '$lib/i18n';

	type Props = {
		rows?: number;
	};

	const { rows = 2 }: Props = $props();
</script>

<div class="skeleton-wallets" role="status" aria-label={$t$('common.loading')} aria-busy="true">
	{#each Array.from({ length: rows }, (_, i) => i) as i (i)}
		<div class="skeleton-wallet">
			<div class="skeleton-wallet-header">
				<div class="skeleton-icon"></div>
				<div class="skeleton-title">
					<div class="skeleton-bar name"></div>
					<div class="skeleton-bar address"></div>
				</div>
			</div>
			<div class="skeleton-wallet-balance">
				<div class="skeleton-bar balance-label"></div>
				<div class="skeleton-bar balance-value"></div>
			</div>
			<div class="skeleton-wallet-actions">
				<div class="skeleton-button"></div>
				<div class="skeleton-button"></div>
			</div>
		</div>
	{/each}
</div>

<style>
	.skeleton-wallets {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.skeleton-wallet {
		background-color: var(--background-color-1);
		border-radius: 0.5rem;
		padding: 1rem;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.15);
	}

	.skeleton-wallet-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.skeleton-icon {
		width: 40px;
		height: 40px;
		border-radius: 0.5rem;
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

	.skeleton-title {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
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
		width: 120px;
	}

	.skeleton-bar.address {
		width: 180px;
		height: 0.85em;
	}

	.skeleton-bar.balance-label {
		width: 60px;
		height: 0.75em;
		margin-bottom: 0.25rem;
	}

	.skeleton-bar.balance-value {
		width: 140px;
		height: 1.5em;
	}

	.skeleton-wallet-balance {
		margin-bottom: 1rem;
	}

	.skeleton-wallet-actions {
		display: flex;
		gap: 0.5rem;
	}

	.skeleton-button {
		height: 36px;
		flex: 1;
		background: linear-gradient(
			90deg,
			var(--background-color-2) 25%,
			rgba(var(--blue), 0.1) 50%,
			var(--background-color-2) 75%
		);
		background-size: 200% 100%;
		border-radius: 0.375em;
		animation: shimmer 1.5s infinite;
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
