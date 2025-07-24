<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';

	const { children } = $props();

	import("@fontsource/inter/400.css");
	import("@fontsource/inter/500.css");
	import('@fortawesome/fontawesome-svg-core/styles.css');
	import("$lib/app.css");
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