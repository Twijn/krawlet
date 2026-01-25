<!--
  @component Button

  A versatile button component supporting multiple variants and states.

  @prop {'primary' | 'secondary' | 'success' | 'error'} variant - Visual style
  @prop {boolean} disabled - Disables the button
  @prop {boolean} full - Makes button full width
  @prop {string} href - If provided, renders as an anchor tag
  @prop {boolean} newTab - Opens link in new tab (when href is set)
  @prop {boolean} external - Marks link as external
  @prop {string} type - Button type ('button' | 'submit' | 'reset')
  @prop {string} title - Tooltip text
  @prop {boolean} loading - Shows loading state
  @prop {(e: Event) => void} onClick - Click handler

  @example
  <Button variant="primary" onClick={handleClick}>Submit</Button>
  <Button href="/settings" variant="secondary">Settings</Button>
-->
<script lang="ts">
	export let href: string | undefined = undefined;
	export let newTab: boolean = false;
	export let variant: 'primary' | 'secondary' | 'success' | 'error' = 'primary';
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let onClick: ((e: Event) => void | boolean | Promise<boolean>) | undefined = undefined;
	export let full: boolean = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let disabled: boolean = false;
	export let external: boolean = false;
	export let title: string | undefined = undefined;
	export let loading: boolean = false;

	$: isDisabled = disabled || loading;

	function handleClick(e: Event) {
		if (isDisabled) {
			e.preventDefault();
			return false;
		}
		if (onClick) {
			onClick(e);
		}
	}
</script>

{#if href}
	<a
		{href}
		class="button {variant} {size}"
		class:disabled={isDisabled}
		class:full
		class:loading
		target={newTab ? '_blank' : undefined}
		rel={external || newTab ? 'noopener noreferrer' : undefined}
		{title}
		onclick={handleClick}
		aria-disabled={isDisabled}
		aria-busy={loading}
	>
		<slot />
	</a>
{:else}
	<button
		onclick={handleClick}
		{type}
		class="button {variant} {size}"
		class:loading
		disabled={isDisabled}
		class:full
		aria-disabled={isDisabled}
		aria-busy={loading}
		{title}
	>
		<slot />
	</button>
{/if}

<style>
	.button {
		box-sizing: border-box;
		font-family: var(--body-font-family), monospace;
		color: var(--primary-text-color);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5em 1em;
		border-radius: 0.375em;
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
	}

	.button :global(svg) {
		margin-right: 0.5em;
	}

	.primary {
		background-color: var(--theme-color-1);
	}

	.secondary {
		background-color: #323537;
		color: #e4e4e4;
	}

	.success {
		background-color: rgb(var(--green));
		color: white;
	}

	.error {
		background-color: rgb(var(--red));
		color: white;
	}

	.button:hover:not(.disabled):not(.loading) {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.button:active:not(.disabled):not(.loading) {
		transform: translateY(0);
	}

	.disabled,
	.button:disabled,
	.loading {
		cursor: not-allowed;
		background-color: #152127;
		color: #acb2b3;
	}

	.loading {
		position: relative;
	}

	.full {
		width: 100%;
	}

	.small {
		font-size: 0.875rem;
		padding: 0.375em 0.75em;
	}

	.medium {
		font-size: 1rem;
		padding: 0.5em 1em;
	}

	.large {
		font-size: 1.125rem;
		padding: 0.625em 1.25em;
	}
</style>
