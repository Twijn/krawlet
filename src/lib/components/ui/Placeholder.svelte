<script lang="ts">
	import settings from '$lib/stores/settings';

	interface Props {
		/** The verbose placeholder text to show when simplePlaceholders is disabled */
		text: string;
	}

	let { text }: Props = $props();
</script>

{#if $settings.simplePlaceholders}
	<span class="placeholder simple">—</span>
{:else}
	<span class="placeholder verbose">{text}</span>
{/if}

<style>
	.placeholder {
		user-select: none;
	}

	.placeholder.simple {
		color: rgba(255, 255, 255, 0.25);
		font-weight: 300;
		letter-spacing: 0.1em;
	}

	.placeholder.verbose {
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.9em;
	}
</style>
