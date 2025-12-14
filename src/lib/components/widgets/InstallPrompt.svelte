<!--
  @component InstallPrompt

  A banner component that prompts users to install the PWA.
  Appears when the browser fires beforeinstallprompt event.

  @example
  <InstallPrompt />
-->
<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faDownload, faTimes } from '@fortawesome/free-solid-svg-icons';
	import {
		installPrompt,
		isInstalled,
		installDismissed,
		promptInstall,
		dismissInstall
	} from '$lib/stores/pwa';
	import { t$ } from '$lib/i18n';
	import Button from '$lib/components/ui/Button.svelte';
	import { scale, fade } from 'svelte/transition';

	let installing = $state(false);

	function handleInstall() {
		installing = true;
		promptInstall().finally(() => {
			installing = false;
		});
	}

	function handleDismiss() {
		dismissInstall();
	}

	// Only show if prompt is available, not installed, and not dismissed
	let show = $derived($installPrompt && !$isInstalled && !$installDismissed);
</script>

{#if show}
	<div
		class="install-prompt"
		role="banner"
		aria-label={$t$('pwa.installApp')}
		in:scale={{ duration: 200, delay: 500 }}
		out:fade={{ duration: 150 }}
	>
		<div class="install-content">
			<FontAwesomeIcon icon={faDownload} size="lg" />
			<p>{$t$('pwa.installPrompt')}</p>
		</div>
		<div class="install-actions">
			<Button
				onClick={() => {
					handleInstall();
				}}
				disabled={installing}
			>
				{#if installing}
					{$t$('common.loading')}
				{:else}
					{$t$('pwa.install')}
				{/if}
			</Button>
			<button
				class="dismiss-btn"
				onclick={handleDismiss}
				aria-label={$t$('pwa.notNow')}
				title={$t$('pwa.notNow')}
			>
				<FontAwesomeIcon icon={faTimes} />
			</button>
		</div>
	</div>
{/if}

<style>
	.install-prompt {
		position: fixed;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 999;
		background-color: rgba(var(--theme-color-rgb), 0.9);
		backdrop-filter: blur(10px);
		border: 1px solid var(--theme-color-2);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		max-width: calc(100% - 2rem);
		width: 400px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.install-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: white;
	}

	.install-content p {
		margin: 0;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.install-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.dismiss-btn {
		background: none;
		border: none;
		color: white;
		opacity: 0.7;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.2s;
	}

	.dismiss-btn:hover,
	.dismiss-btn:focus-visible {
		opacity: 1;
	}

	@media (max-width: 480px) {
		.install-prompt {
			flex-direction: column;
			width: calc(100% - 2rem);
			text-align: center;
		}

		.install-content {
			flex-direction: column;
		}

		.install-actions {
			width: 100%;
			justify-content: center;
		}
	}
</style>
