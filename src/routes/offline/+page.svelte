<script lang="ts">
	import { t$ } from '$lib/i18n';
	import Button from '$lib/components/ui/Button.svelte';
	import { faWifi, faRefresh } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	function retry() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>{$t$('common.offline')} - Krawlet</title>
</svelte:head>

<main class="offline-page" aria-labelledby="offline-title">
	<div class="offline-content">
		<div class="offline-icon" aria-hidden="true">
			<FontAwesomeIcon icon={faWifi} size="4x" />
		</div>

		<h1 id="offline-title">{$t$('common.offline')}</h1>

		<p class="offline-message">
			{$t$('errors.offline')}
		</p>

		<p class="offline-hint">
			{$t$('accessibility.offlineHint')}
		</p>

		<div class="offline-actions">
			<Button onClick={retry}>
				<FontAwesomeIcon icon={faRefresh} />
				{$t$('common.retry')}
			</Button>
		</div>
	</div>
</main>

<style>
	.offline-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 2rem;
	}

	.offline-content {
		text-align: center;
		max-width: 400px;
	}

	.offline-icon {
		color: var(--theme-color-1);
		margin-bottom: 1.5rem;
		opacity: 0.7;
	}

	h1 {
		color: var(--theme-color-1);
		margin-bottom: 1rem;
		font-size: 2rem;
	}

	.offline-message {
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
	}

	.offline-hint {
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: 2rem;
		font-size: 0.9rem;
	}

	.offline-actions {
		display: flex;
		justify-content: center;
	}
</style>
