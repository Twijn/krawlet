<script lang="ts">
	import "$lib/app.css";
	import {config} from '@fortawesome/fontawesome-svg-core';
	import '@fortawesome/fontawesome-svg-core/styles.css';

	import "@fontsource/inter/400.css";
	import "@fontsource/inter/500.css";
	import Alert from '$lib/components/Alert.svelte';

	config.autoAddCss = false;

	const { children } = $props();
</script>

<div class="container">
	<div class="col-12">
		<Alert variant="danger">
			<strong>Warning!</strong>
			<p>This application is still in early beta! There will be bugs!</p>
		</Alert>
	</div>

	{@render children?.()}
</div>