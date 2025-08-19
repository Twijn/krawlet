<script lang="ts">
	import '$lib/app.css';
	import { config } from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';
	import { faBars } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	import '@fontsource/inter/300.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import Navigation from '$lib/components/Navigation.svelte';

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
		<button id="show-navigation" onclick={() => showNavigation = !showNavigation} aria-label="Toggle navigation">
			<FontAwesomeIcon icon={faBars} />
		</button>
		<a href="/">Krawlet</a>
	</header>
	<aside>
		<Navigation />
	</aside>
	<div id="content">
		<main class="container">
			{@render children?.()}
		</main>
		<footer>
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

<style>
    :root {
        --mobile-breakpoint: 768px;
    }

    #app {
        display: grid;
        width: 100%;
        height: 100vh;
        grid-template-columns: 250px 1fr;
        grid-template-rows: 3.5em 1fr;
    }

    @media (max-width: 768px) {
        #app {
            grid-template-columns: 1fr;
        }

        aside {
            position: fixed;
            top: 3.5rem;
            left: 0;
            bottom: 0;
            width: 250px;
            z-index: 5;
        }
    }

    #app.nav-hidden aside {
		display: none;
  }

  #app.nav-hidden {
      grid-template-columns: 1fr;
  }

  header {
			display: flex;
			align-items: center;
      grid-column: 1 / -1;
      background-color: var(--background-color-2);
      padding: 0.5rem;
			border-bottom: .1em solid var(--theme-color-2);
			z-index: 10;
			box-shadow: 0 0 1em rgba(0, 0, 0, 0.15);
  }

  header button {
      background: none;
      border: none;
      color: var(--text-color-2);
      cursor: pointer;
      padding: 0.5rem;
  }

	header a {
			font-size: 1.2em;
			color: white;
			text-decoration: none;
	}

  aside {
      background-color: var(--background-color-2);
      color: var(--text-color-1);
      overflow-y: auto;
      box-shadow: 0 0 1em rgba(0, 0, 0, 0.15);
  }

  #content {
      max-height: 100vh;
      overflow-y: auto;
      padding: 1rem;
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
</style>
