<script lang="ts">
	type AlertVariant = 'info' | 'success' | 'danger';

	export let variant: AlertVariant = 'info';
</script>

<div
	class="alert col-12"
	class:info={variant === 'info'}
	class:success={variant === 'success'}
	class:danger={variant === 'danger'}
	role="alert"
>
	<slot />
</div>

<style>
	.info {
		--variant-color: var(--blue);
	}

	.success {
		--variant-color: var(--green);
	}

	.danger {
		--variant-color: var(--red);
	}

	.alert {
		padding: 1rem 1.25rem;
		margin: 1rem 0;
		border-left: 3px solid rgba(var(--variant-color), 0.6);
		color: rgba(var(--variant-color), 1);
		background: linear-gradient(
			90deg,
			rgba(var(--variant-color), 0.15) 0%,
			rgba(var(--variant-color), 0.05) 100%
		);
		border-radius: 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.alert :global(p) {
		margin: 0.25em 0;
	}

	.alert :global(p:last-of-type) {
		margin-bottom: 0;
	}

	.alert :global(strong) {
		font-weight: 600;
		color: rgba(var(--variant-color), 1);
	}
</style>
