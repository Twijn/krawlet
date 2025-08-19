<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import { scale, fade } from 'svelte/transition';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
</script>

<div class="notifications-container">
	{#each $notifications as notification (notification.id)}
		<div
			class="notification"
			class:success={notification.type === 'success'}
			class:info={notification.type === 'info'}
			class:error={notification.type === 'error'}
			class:warning={notification.type === 'warning'}
			in:scale
			out:fade
		>
			<p>{notification.message}</p>
			<button on:click={() => notifications.remove(notification.id)}>
				<FontAwesomeIcon icon={faTimes} />
			</button>
		</div>
	{/each}
</div>

<style>
	.notifications-container {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: calc(100% - 2rem);
	}

	.notification {
		padding: 1rem;
		border-radius: 0.5rem;
		background-color: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.notification p {
		margin: 0;
	}

	.notification button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		color: currentColor;
		opacity: 0.7;
	}

	.notification button:hover {
		opacity: 1;
	}

	.success {
		background-color: rgb(var(--green));
		color: white;
	}

	.error {
		background-color: rgb(var(--red));
		color: white;
	}

	.info {
		background-color: var(--theme-color-1);
		color: white;
	}

	.warning {
		background-color: #ff9800;
		color: white;
	}
</style>
