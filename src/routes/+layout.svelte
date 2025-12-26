<script lang="ts">
	import '$lib/app.css';
	import { config } from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import { faArrowDown, faBars, faGear } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	import '@fontsource/inter/300.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';

	import Navigation from '$lib/components/ui/Navigation.svelte';
	import { getSyncNode, SYNC_NODE_OFFICIAL, VERSION } from '$lib/consts';
	import Notifications from '$lib/components/dialogs/Notifications.svelte';
	import Confirm from '$lib/components/dialogs/Confirm.svelte';
	import Prompt from '$lib/components/dialogs/Prompt.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import settings from '$lib/stores/settings';
	import InstallPrompt from '$lib/components/widgets/InstallPrompt.svelte';
	import UpdatePrompt from '$lib/components/widgets/UpdatePrompt.svelte';
	import ConnectionStatus from '$lib/components/widgets/ConnectionStatus.svelte';
	import { initPWA, isOnline } from '$lib/stores/pwa';
	import { websocket } from '$lib/stores/websocket';
	import { initLocale, t$ } from '$lib/i18n';

	config.autoAddCss = false;

	const { children } = $props();
	let showNavigation = $state(false);
	let showSyncNodeWarning = $state(true);

	let handleResize: () => void;
	let cleanupPWA: (() => void) | undefined;

	onMount(() => {
		handleResize = () => {
			showNavigation = window.innerWidth > 768;
		};
		handleResize();

		window.addEventListener('resize', handleResize);

		// Initialize PWA features
		cleanupPWA = initPWA();

		// Initialize i18n with saved language
		initLocale($settings.language);

		// Connect WebSocket for real-time updates
		websocket.connect();
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', handleResize);
			cleanupPWA?.();
			websocket.disconnect();
		}
	});

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('#show-navigation') && window.innerWidth <= 768) {
			showNavigation = false;
		}
	}

	function revertNode() {
		$settings.syncNode = SYNC_NODE_OFFICIAL.id;
		if (browser) {
			location.reload();
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
		<a href="/" aria-label="Krawlet - Home">Krawlet</a>
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
		</footer>
	</div>
</div>

<Notifications />
<Confirm />
<Prompt />
<InstallPrompt />
<UpdatePrompt />

{#if !$isOnline}
	<div class="offline-banner" role="alert" aria-live="assertive">
		<p>{$t$('pwa.offline')}: {$t$('pwa.offlineMessage')}</p>
	</div>
{/if}

{#if !getSyncNode().official}
	<div class="sync-node-warning" class:hide={!showSyncNodeWarning}>
		<button
			class="close-btn"
			aria-label={$t$('syncNodeWarning.closeWarning')}
			onclick={() => (showSyncNodeWarning = !showSyncNodeWarning)}
		>
			<FontAwesomeIcon icon={faArrowDown} size="2xs" />
		</button>
		{#if showSyncNodeWarning}
			<p>
				{$t$('syncNodeWarning.warning', { name: getSyncNode().name, url: getSyncNode().url })}
				<br />
				<strong>!! {$t$('syncNodeWarning.privateKeyWarning')} !!</strong>
			</p>
			<Button variant="error" full type="button" onClick={revertNode}
				>{$t$('syncNodeWarning.revertToOfficial')}</Button
			>
		{:else}
			{$t$('syncNodeWarning.connectedToCustom', { name: getSyncNode().name })}
		{/if}
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
		z-index: 10;
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
		z-index: 5;
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
		font-size: 0.8rem;
		text-align: center;
		margin-top: 1rem;
		opacity: 0.6;
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
		z-index: 100;
		text-align: center;
		background-color: rgba(var(--red), 0.8);
		padding: 0.5em 1em;
		color: white;
		font-size: 0.9rem;
	}

	.offline-banner p {
		margin: 0;
	}

	.sync-node-warning {
		position: fixed;
		width: calc(100% - 3em);
		max-width: 35em;
		bottom: 1em;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		text-align: center;
		background-color: rgba(var(--red), 0.6);
		border: 0.1em solid rgba(var(--red), 0.8);
		padding: 0.6em 0.75em;
		border-radius: 0.5em;
		backdrop-filter: blur(5px);
		color: white;
		box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
		transition: 0.25s;
	}

	.sync-node-warning.hide {
		max-width: 30em;
		bottom: -1em;
		padding: 0.25em 0.75em 1em 0.25em;
	}

	.close-btn {
		position: absolute;
		top: 0.2em;
		right: 0.2em;
		background: none;
		border: none;
		color: white;
		font-size: 1.5em;
		cursor: pointer;
		opacity: 0.7;
		transition: 0.25s;
	}
	.close-btn:hover,
	.close-btn:focus-visible {
		opacity: 1;
		color: rgb(var(--red));
	}

	.sync-node-warning.hide .close-btn {
		top: -0.1em;
		right: -0.1em;
		transform: rotate(180deg);
	}

	/* Focus styles for skip link target */
	#main-content:focus {
		outline: none;
	}
</style>
