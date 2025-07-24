<script lang="ts">
	type AlertVariant = 'info' | 'success' | 'danger';

	export let variant: AlertVariant = 'info';
</script>

<div class="alert col-12"
		 class:info={variant === "info"}
		 class:success={variant === "success"}
		 class:danger={variant === "danger"}
		 role="alert">
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
        padding: 1rem;
        margin: 1rem 0;
        border-left: .25em solid rgba(var(--variant-color), 0.5);
        color: rgba(var(--variant-color), 1);
        background-color: rgba(var(--variant-color), 0.1);
    }

    .alert :global(p) {
        margin: .25em 0;
    }

    .alert :global(p:last-of-type) {
        margin-bottom: 0;
    }
</style>
