<script lang="ts">
	import '$lib/app.css';
	import { config } from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';

	import '@fontsource/inter/300.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import Navigation from '$lib/components/Navigation.svelte';

	config.autoAddCss = false;

	const { children } = $props();
</script>

<div id="app">
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
	#app {
		display: grid;
		width: 100%;
		height: 100vh;
		grid-template-columns: 250px 1fr;
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
