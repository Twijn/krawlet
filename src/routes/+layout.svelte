<script lang="ts">
	import '$lib/app.css';
	import { config } from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import { faBars, faGear } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	import '@fontsource/inter/300.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import Navigation from '$lib/components/ui/Navigation.svelte';
	import { VERSION } from '$lib/consts';
	import Notifications from '$lib/components/dialogs/Notifications.svelte';
	import Confirm from '$lib/components/dialogs/Confirm.svelte';
	import Alert from '$lib/components/dialogs/Alert.svelte';

	config.autoAddCss = false;

	const { children } = $props();
	let showNavigation = $state(false);

	let handleResize: () => void;

	onMount(() => {
		handleResize = () => {
			showNavigation = window.innerWidth > 768;
		};
		handleResize();

		window.addEventListener('resize', handleResize);
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', handleResize);
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

<div id="app" class:nav-hidden={!showNavigation}>
	<header>
		<button
			id="show-navigation"
			onclick={() => (showNavigation = !showNavigation)}
			aria-label="Toggle navigation"
		>
			<FontAwesomeIcon icon={faBars} size="lg" />
		</button>
		<a href="/">Krawlet</a>
		<a href="/settings" class="settings-btn" aria-label="Settings" style="margin-left:auto;">
			<FontAwesomeIcon icon={faGear} size="lg" />
		</a>
	</header>
	<aside>
		<Navigation />
	</aside>
	<div id="content">
		<Alert variant="danger">
			<strong style="font-size: 1.2em;">!! YOU ARE IN KRAWLET STAGING !!</strong>
			<p>
				Staging uses an alternative sync node to <code>kromer.reconnected.cc</code>.
				Please <a href="https://www.kromer.club" style="color: var(--variant-color);">click here to return to production Krawlet</a>
			</p>
		</Alert>
		<main class="container">
			{@render children?.()}
		</main>
		<footer>
			<p>Version {VERSION}</p>
			<p>
				Made for the <a href="https://reconnected.cc/" target="_blank">Reconnected</a> community by
				<a href="https://www.twijn.dev" target="_blank">Twijn</a>
			</p>
			<p>
				View the project on <a href="https://github.com/Twijn/krawlet" target="_blank">GitHub</a>
			</p>
		</footer>
	</div>
</div>

<Notifications />
<Confirm />

<style>
	header {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		display: flex;
		align-items: center;
		background-color: var(--background-color-2);
		padding: 0.5rem;
		height: 3rem;
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

	aside {
		position: fixed;
		top: 4.1rem;
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
		overflow-y: auto;
		margin-top: 4.1rem;
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
		color: var(--text-color-1);
		cursor: pointer;
		padding: 0.5rem 1.5rem;
		display: flex;
		align-items: center;
		font-size: 1.2em;
		text-decoration: none;
		transition: color 0.25s ease-in-out;
	}

	.settings-btn:hover,
	.settings-btn:focus-visible {
		color: var(--theme-color-2);
	}
</style>
