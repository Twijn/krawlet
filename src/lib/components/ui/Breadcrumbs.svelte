<script lang="ts">
	import type { BreadcrumbProps } from './Breadcrumbs';
	import { t$ } from '$lib/i18n';
	import Button from './Button.svelte';

	const {
		navItems = [],
		buttons = [],
		defaultButtonProps = {
			variant: 'secondary',
			size: 'small'
		}
	}: BreadcrumbProps = $props();
</script>

<div class="breadcrumbs">
	<h1>
		<a href="/">Krawlet</a
		><!-- this provides a consistent "home" link and separator, even if no navItems are provided
     -->{#each navItems as item, i (item.href ?? item.tl ?? item.label ?? `crumb-${i}`)}
			<span class="separator">&raquo;</span><a href={item.href}>
				{#if item.tl}
					{$t$(item.tl)}
				{:else if item.label}
					{item.label}
				{:else}
					<small>No Label</small>
				{/if}
			</a>
		{/each}
	</h1>
	{#if buttons && defaultButtonProps}
		<nav class="buttons">
			{#each buttons as button, i (button.title ?? button.tk ?? button.href ?? `${button.type ?? 'button'}-${button.variant ?? 'secondary'}-${i}`)}
				<Button {...defaultButtonProps} {...button} />
			{/each}
		</nav>
	{/if}
</div>

<style>
	.breadcrumbs {
		display: flex;
		grid-column: span 12;
	}

	.buttons {
		display: flex;
		gap: 0.5em;
		flex-direction: row;
	}

	h1 {
		font-size: 1.5em;
		font-weight: 400;
		margin: 0;
		flex-grow: 1;
	}

	h1 a {
		color: var(--text-color-1);
		text-decoration: none;
	}

	.separator {
		margin: 0 0.3em;
		opacity: 0.5;
	}

	@media only screen and (max-width: 600px) {
		.breadcrumbs {
			flex-direction: column;
			gap: 0.75em;
		}

		.buttons {
			width: 100%;
		}
	}
</style>
