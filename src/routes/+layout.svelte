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
	import '@fontsource/inter/600.css';
	import Navigation from '$lib/components/ui/Navigation.svelte';
	import { getSyncNode, SYNC_NODE_OFFICIAL, VERSION } from '$lib/consts';
	import Notifications from '$lib/components/dialogs/Notifications.svelte';
	import Confirm from '$lib/components/dialogs/Confirm.svelte';
	import Prompt from '$lib/components/dialogs/Prompt.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import settings from '$lib/stores/settings';

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

	function revertNode() {
		$settings.syncNode = SYNC_NODE_OFFICIAL.id;
		if (browser) {
			location.reload();
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
<Prompt />

{#if !getSyncNode().official}
	<div class="sync-node-warning">
		<p>
			Warning: You are connected to a custom sync node {getSyncNode().name} -
			<em>{getSyncNode().url}</em>.
			<br />
			<strong>!! You should <em>not</em> enter any private keys you use in production !!</strong>
		</p>
		<Button variant="error" full type="button" onClick={revertNode}>Revert to Official Node</Button>
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

	.sync-node-warning {
		position: fixed;
		width: calc(100% - 3em);
		max-width: 35em;
		bottom: 1em;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		text-align: center;
		background-color: rgba(var(--red), 0.5);
		border: 0.1em solid rgba(var(--red), 0.7);
		padding: 0.6em 0.75em;
		border-radius: 0.5em;
		backdrop-filter: blur(5px);
		color: white;
		box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
	}
</style>
