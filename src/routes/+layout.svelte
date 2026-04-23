<script lang="ts">
	import '$lib/app.css';
	import { config } from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import { faBars, faGear } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	import '@fontsource/inter/300.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/space-grotesk/600.css';

	import Navigation from '$lib/components/ui/Navigation.svelte';
	import { VERSION } from '$lib/consts';
	import Notifications from '$lib/components/dialogs/Notifications.svelte';
	import Confirm from '$lib/components/dialogs/Confirm.svelte';
	import Prompt from '$lib/components/dialogs/Prompt.svelte';
	import AddWalletModal from '$lib/components/dialogs/AddWalletModal.svelte';
	import EditWalletModal from '$lib/components/dialogs/EditWalletModal.svelte';
	import RefundModal from '$lib/components/dialogs/RefundModal.svelte';
	import settings from '$lib/stores/settings';
	import InstallPrompt from '$lib/components/widgets/InstallPrompt.svelte';
	import UpdatePrompt from '$lib/components/widgets/UpdatePrompt.svelte';
	import ConnectionStatus from '$lib/components/widgets/ConnectionStatus.svelte';
	import ApiStatus from '$lib/components/widgets/ApiStatus.svelte';
	import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
	import { initPWA, isOnline } from '$lib/stores/pwa';
	import { krawletWebsocket } from '$lib/stores/krawletWebsocket';
	import { websocket } from '$lib/stores/websocket';
	import { contextMenu } from '$lib/stores/contextMenu';
	import { initLocale, t$ } from '$lib/i18n';
	import MasterPasswordModal from '$lib/components/dialogs/MasterPasswordModal.svelte';

	config.autoAddCss = false;

	injectAnalytics();

	const { children } = $props();
	let showNavigation = $state(false);

	let handleResize: () => void;
	let handleImageError: (event: Event) => void;
	let cleanupPWA: (() => void) | undefined;

	onMount(() => {
		handleResize = () => {
			showNavigation = window.innerWidth > 768;
		};

		handleImageError = (event: Event) => {
			const target = event.target;
			if (!(target instanceof HTMLImageElement)) return;

			try {
				const srcUrl = new URL(target.src);
				const isKrawletCdn = srcUrl.hostname === 'cdn.krawlet.cc';
				const isPng = srcUrl.pathname.endsWith('.png');
				const isFallback = srcUrl.pathname === '/minecraft/air.png';

				if (!isKrawletCdn || !isPng || isFallback) return;

				target.src = 'https://cdn.krawlet.cc/minecraft/air.png';
			} catch {
				// Ignore invalid image URLs.
			}
		};
		handleResize();

		window.addEventListener('resize', handleResize);
		window.addEventListener('error', handleImageError, true);

		// Initialize PWA features
		cleanupPWA = initPWA();

		// Initialize i18n with saved language
		initLocale($settings.language);

		// Connect WebSocket for real-time updates
		websocket.connect();
		krawletWebsocket.connect();
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('error', handleImageError, true);
			cleanupPWA?.();
			websocket.disconnect();
			krawletWebsocket.disconnect();
		}
	});

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('#show-navigation') && window.innerWidth <= 768) {
			showNavigation = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<a href="#main-content" class="skip-link">{$t$('accessibility.skipToContent')}</a>

<div id="app" class:nav-hidden={!showNavigation}>
	<header>
		<button
			id="show-navigation"
			onclick={() => (showNavigation = !showNavigation)}
			aria-label={$t$('accessibility.menuToggle')}
			aria-expanded={showNavigation}
			aria-controls="main-navigation"
		>
			<FontAwesomeIcon icon={faBars} size="lg" />
		</button>
		<a href="/" class="logo" aria-label="Krawlet - Home">Krawlet</a>
		<div class="header-right">
			<ConnectionStatus />
			<a href="/settings" class="settings-btn" aria-label={$t$('accessibility.openSettings')}>
				<FontAwesomeIcon icon={faGear} size="1x" />
			</a>
		</div>
	</header>
	<aside id="main-navigation" role="navigation" aria-label={$t$('accessibility.navigation')}>
		<Navigation />
	</aside>
	<div id="content">
		<main
			id="main-content"
			class="container"
			aria-label={$t$('accessibility.mainContent')}
			tabindex="-1"
		>
			{@render children?.()}
		</main>
		<footer aria-label={$t$('accessibility.footer')}>
			<div class="footer-content">
				<p>
					{$t$('footer.version', { version: VERSION })}
					<small>&bullet;</small>
					<a href="/whats-new">{$t$('footer.whatsNew')}</a>
				</p>
				<p>
					Made for the <a href="https://reconnected.cc/" target="_blank" rel="noopener noreferrer"
						>Reconnected</a
					>
					community by
					<a href="https://www.twijn.dev" target="_blank" rel="noopener noreferrer">Twijn</a>
				</p>
				<p>
					<a href="https://github.com/Twijn/krawlet" target="_blank" rel="noopener noreferrer"
						>{$t$('footer.viewOnGithub')}</a
					>
				</p>
			</div>
			<div class="footer-status">
				<ApiStatus />
			</div>
		</footer>
	</div>
</div>

<Notifications />
<Confirm />
<Prompt />
<AddWalletModal />
<EditWalletModal />
<RefundModal />
<InstallPrompt />
<UpdatePrompt />
<ContextMenu
	items={$contextMenu.items}
	x={$contextMenu.x}
	y={$contextMenu.y}
	visible={$contextMenu.visible}
	onClose={contextMenu.hide}
/>
<MasterPasswordModal />

{#if !$isOnline}
	<div class="offline-banner" role="alert" aria-live="assertive">
		<p>{$t$('pwa.offline')}: {$t$('pwa.offlineMessage')}</p>
	</div>
{/if}

<style>
	header {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		display: flex;
		align-items: center;
		background-color: var(--background-color-2);
		height: 3.8rem;
		border-bottom: 0.1em solid var(--theme-color-2);
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.15);
		z-index: 10000;
	}

	header button {
		background: none;
		border: none;
		color: var(--text-color-2);
		cursor: pointer;
		padding: 1rem;
	}

	header a {
		font-size: 1.4em;
		color: white;
		text-decoration: none;
	}

	header a.logo {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--theme-color);
		transition: opacity 0.2s ease;
	}

	header a.logo:hover {
		opacity: 0.85;
	}

	.header-right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	aside {
		position: fixed;
		top: 3.8rem;
		left: 0;
		bottom: 0;
		width: 250px;
		background-color: var(--background-color-2);
		color: var(--text-color-1);
		overflow-y: auto;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.15);
		z-index: 999;
		transition: 0.3s ease-in-out;
	}

	#app.nav-hidden aside {
		left: -250px;
		opacity: 0;
		pointer-events: none;
	}

	#content {
		margin-top: 3.8rem;
		padding: 1rem;
		margin-left: 250px;
		transition: margin-left 0.3s ease-in-out;
	}

	#app.nav-hidden #content {
		margin-left: 0;
	}

	@media only screen and (max-width: 768px) {
		#content {
			margin-left: 0;
			padding: 0.75rem;
		}
	}

	footer {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.8rem;
		margin-top: 1rem;
		color: var(--text-color-2);
	}

	.footer-content {
		text-align: left;
	}

	.footer-status {
		display: flex;
		align-items: center;
	}

	@media only screen and (max-width: 600px) {
		footer {
			flex-direction: column;
			align-items: center;
		}

		.footer-content {
			text-align: center;
		}
	}

	footer p {
		margin: 0.25rem 0;
	}

	footer a {
		color: var(--text-color-2);
	}
	.settings-btn {
		background: none;
		border: none;
		color: var(--text-color-2);
		cursor: pointer;
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		font-size: 1em;
		text-decoration: none;
		transition: color 0.25s ease-in-out;
	}

	.settings-btn:hover,
	.settings-btn:focus-visible {
		color: var(--theme-color-2);
	}

	.offline-banner {
		position: fixed;
		top: 3.8rem;
		left: 0;
		right: 0;
		z-index: 10000;
		text-align: center;
		background-color: rgba(var(--red), 0.8);
		padding: 0.5em 1em;
		color: white;
		font-size: 0.9rem;
	}

	.offline-banner p {
		margin: 0;
	}

	/* Focus styles for skip link target */
	#main-content:focus {
		outline: none;
	}
</style>
