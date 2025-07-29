<script lang="ts">
	import '$lib/app.css';
	import { config } from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';

	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';

	config.autoAddCss = false;

	const { children } = $props();
</script>

<div class="container">
	{@render children?.()}
</div>
<footer>
	<p>
		Made for the <a href="https://reconnected.cc/" target="_blank">Reconnected</a> community
		by <a href="https://www.twijn.dev" target="_blank">Twijn</a>
	</p>
	<p>
		View the project on <a href="https://github.com/Twijn/krawlet" target="_blank">GitHub</a>
	</p>
</footer>

<style>
	footer {
			font-size: .8rem;
			text-align: center;
      padding: 1rem;
			opacity: .6;
	}

	footer p {
			margin: .25rem 0;
	}

	footer a {
			color: var(--text-color-2);
	}
</style>
