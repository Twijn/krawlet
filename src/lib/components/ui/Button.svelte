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
		gap: 0.35em;
		padding: 0.5em 1em;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(8px);
	}

	.button::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.1);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.button:hover::before {
		opacity: 1;
	}

	.button :global(svg) {
		transition: transform 0.2s ease;
	}

	.button:hover:not(.disabled):not(.loading) :global(svg) {
		transform: scale(1.1);
	}

	.primary {
		background-color: var(--theme-color-1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.primary:hover:not(.disabled):not(.loading) {
		border-color: rgba(255, 255, 255, 0.15);
	}

	.secondary {
		background-color: rgba(50, 53, 55, 0.6);
		color: #e4e4e4;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.secondary:hover:not(.disabled):not(.loading) {
		background-color: rgba(50, 53, 55, 0.8);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.success {
		background-color: rgb(var(--green));
		color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.error {
		background-color: rgb(var(--red));
		color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.button:hover:not(.disabled):not(.loading) {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.button:active:not(.disabled):not(.loading) {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
