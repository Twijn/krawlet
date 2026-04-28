<script lang="ts">
	import '$lib/app.css';
	import { config, type IconDefinition } from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import { faBars, faCheck, faEllipsis, faExclamation, faGear, faSignIn, faSpinner, faTimes, faWallet } from '@fortawesome/free-solid-svg-icons';
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
	import ApiStatus from '$lib/components/widgets/ApiStatus.svelte';
	import ContextMenu from '$lib/components/ui/ContextMenu.svelte';
	import { initPWA, isOnline } from '$lib/stores/pwa';
	import { krawletWebsocket } from '$lib/stores/krawletWebsocket';
	import { websocket, type WebSocketState } from '$lib/stores/websocket';
	import { contextMenu } from '$lib/stores/contextMenu';
	import { initLocale, t$ } from '$lib/i18n';
	import MasterPasswordModal from '$lib/components/dialogs/MasterPasswordModal.svelte';
	import apiKeyInfo from '$lib/stores/apiKeyInfo';
	import { getMinecraftAvatar } from '$lib/util';
	import { scale } from 'svelte/transition';
	import { isValidApiKey } from '$lib/api/krawlet';
	import KrawletLoginModal from '$lib/components/dialogs/KrawletLoginModal.svelte';

	config.autoAddCss = false;

	injectAnalytics();

	const { children } = $props();
	let showNavigation = $state(false);
	let showQuickMenu = $state(false);

	let krawletLoginModalOpen = $state(false);

	let handleResize: () => void;
	let handleImageError: (event: Event) => void;
	let cleanupPWA: (() => void) | undefined;

	// Fetch API key info when the key changes
	$effect(() => {
		// Only fetch info for valid API keys (must start with 'kraw_')
		if ($settings.krawletApiKey && isValidApiKey($settings.krawletApiKey)) {
			// Small delay to allow the client to update with the new key
			setTimeout(() => {
				apiKeyInfo.ensureLoaded();
			}, 100);
		} else {
			apiKeyInfo.clear();
		}
	});

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
		if (!target.closest("#quick-menu") && !target.closest(".show-quick-menu")) {
			showQuickMenu = false;
		}
	}

	type QuickMenuLink = {
		label: string;
		href?: string;
		onclick?: () => void;
		icon: IconDefinition;
		cta?: boolean;
	}

	let quickMenuLinks = $state<QuickMenuLink[]>([]);

	$effect(() => {
		const links: QuickMenuLink[] = [
			{ label: $t$('quickMenu.wallets'), href: '/wallets', icon: faWallet },
			{ label: $t$('quickMenu.settings'), href: '/settings', icon: faGear }
		];

		if (!$settings.krawletApiKey || !isValidApiKey($settings.krawletApiKey)) {
			links.push({
				label: $t$('quickMenu.login'),
				onclick: () => {
					krawletLoginModalOpen = true;
				},
				icon: faSignIn,
				cta: true
			});
		}

		quickMenuLinks = links;
	});

	type Service = {
		name: string;
		getStatus: () => WebSocketState;
	}
	
	let services: Service[] = [
		{ name: 'Kromer WS', getStatus: () => websocket.getState() },
		{ name: 'Krawlet WS (Klog)', getStatus: () => krawletWebsocket.getState() }
	];
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
			<button type="button" class="show-quick-menu" aria-label={$t$('accessibility.quickMenu')} onclick={() => {showQuickMenu = !showQuickMenu}} aria-haspopup="true">
				<FontAwesomeIcon icon={faEllipsis} size="lg" />
			</button>
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
<KrawletLoginModal bind:open={krawletLoginModalOpen} />

{#if !$isOnline}
	<div class="offline-banner" role="alert" aria-live="assertive">
		<p>{$t$('pwa.offline')}: {$t$('pwa.offlineMessage')}</p>
	</div>
{/if}

{#if showQuickMenu}
	<aside
		id="quick-menu"
		aria-label={$t$('accessibility.quickMenu')}
		transition:scale={{ duration: 100, start: 0.95, opacity: 0 }}
	>
		{#each services as service (service.name)}
			{@const status = service.getStatus()}
			<div class="service-status">
				<span>{service.name}</span>
				<span class="status-indicator title-full-right" class:status-connected={status === 'connected'} class:status-connecting={status === 'connecting'} class:status-disconnected={status === 'disconnected'} class:status-error={status === 'error'}>
					<FontAwesomeIcon spin={status === "connecting"} icon={status === 'connected' ? faCheck : status === 'connecting' ? faSpinner : status === 'disconnected' ? faTimes : faExclamation} fixedWidth />
					{status}
				</span>
			</div>
		{/each}
		{#if $apiKeyInfo.mcUuid && $apiKeyInfo.mcName}
			<div class="minecraft-player">
				<img src={getMinecraftAvatar($apiKeyInfo.mcUuid)} alt="{$apiKeyInfo.mcName}'s avatar" />
				<span>{$apiKeyInfo.mcName}</span>
			</div>
		{:else if !$settings.krawletApiKey || !isValidApiKey($settings.krawletApiKey)}
			<div class="not-logged-in">
				{$t$('quickMenu.notLoggedIn')}
			</div>
		{/if}
		<ul>
			{#each quickMenuLinks as link (link.href)}
				<li class:cta={link.cta}>
					{#if link.href}
						<a href={link.href} role="menuitem">
							<FontAwesomeIcon icon={link.icon} fixedWidth />
							<span>{link.label}</span>
						</a>
					{:else}
						<button onclick={link.onclick} role="menuitem">
							<FontAwesomeIcon icon={link.icon} fixedWidth />
							<span>{link.label}</span>
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	</aside>
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

	#main-navigation {
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

	#app.nav-hidden #main-navigation {
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

	#quick-menu {
		position: fixed;
		top: 4.5rem;
		right: 0.75rem;
		background-color: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		box-shadow:
			0 10px 40px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(255, 255, 255, 0.05);
		width: calc(100% - 1.5rem);
		max-width: 18rem;
		padding: 0.35rem;
		overflow: hidden;
		z-index: 10001;
	}

	#quick-menu ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	#quick-menu li {
		margin: 0;
	}

	#quick-menu li.cta {
		margin-top: 0.35rem;
	}

	#quick-menu li.cta a, #quick-menu li.cta button {
		background-color: rgba(var(--theme-color-rgb), 0.16);
		border: 1px solid rgba(var(--theme-color-rgb), 0.35);
		font-weight: 600;
	}

	#quick-menu li.cta a :global(svg), #quick-menu li.cta button :global(svg) {
		color: var(--theme-color-2);
	}

	#quick-menu li :global(svg) {
		color: var(--text-color-2);
	}

	#quick-menu .minecraft-player {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		margin-top: 0.35rem;
		margin-bottom: 0.35rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--text-color-1);
		font-size: 0.9rem;
	}

	#quick-menu .minecraft-player img {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.not-logged-in {
		padding: 0.6rem 0.75rem;
		margin-top: 0.35rem;
		margin-bottom: 0.35rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		color: var(--text-color-2);
		font-size: 0.85rem;
		text-align: center;
	}

	#quick-menu ul a, #quick-menu ul button {
		display: flex;
		gap: 0.5em;
		align-items: center;
		background: transparent;
		border: none;
		text-decoration: none;
		width: 100%;
		padding: 0.6rem 0.75rem;
		border-radius: 0.35rem;
		color: var(--text-color-1);
		font-size: 0.9rem;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	#quick-menu ul a:hover,
	#quick-menu ul a:focus-visible,
	#quick-menu ul button:hover,
	#quick-menu ul button:focus-visible {
		background-color: rgba(var(--theme-color-rgb), 0.2);
		color: white;
	}

	#quick-menu li.cta a:hover,
	#quick-menu li.cta a:focus-visible,
	#quick-menu li.cta button:hover,
	#quick-menu li.cta button:focus-visible {
		background-color: rgba(var(--theme-color-rgb), 0.28);
		border-color: rgba(var(--theme-color-rgb), 0.6);
	}

	#quick-menu .service-status {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
		color: var(--text-color-2);
	}

	#quick-menu .status-indicator.status-connecting {
		--color: rgb(var(--yellow));
	}

	#quick-menu .status-indicator.status-connected {
		--color: rgb(var(--green));
	}

	#quick-menu .status-indicator.status-disconnected {
		--color: rgb(var(--orange));
	}

	#quick-menu .status-indicator.status-error {
		--color: rgb(var(--red));
	}

	#quick-menu .status-indicator {
		color: var(--color);
		font-size: 0.75rem;
		padding: 0.15rem 0.4rem;
		border-radius: 0.25rem;
		text-transform: capitalize;
	}

	@media only screen and (max-width: 480px) {
		#quick-menu {
			right: 0.5rem;
			max-width: calc(100vw - 1rem);
			min-width: min(12rem, calc(100vw - 1rem));
		}
	}
</style>
