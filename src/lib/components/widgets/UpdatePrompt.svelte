<script lang="ts">
	import { updateAvailable, applyUpdate } from '$lib/stores/pwa';
	import { t$ } from '$lib/i18n';
	import Button from '$lib/components/ui/Button.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faRefresh, faTimes } from '@fortawesome/free-solid-svg-icons';

	let dismissed = $state(false);
	let updating = $state(false);

	async function handleUpdate(): Promise<boolean> {
		updating = true;
		await applyUpdate();
		return true;
	}

	function handleDismiss() {
		dismissed = true;
	}
</script>

{#if $updateAvailable && !dismissed}
	<div class="update-banner" role="alert">
		<div class="update-content">
			<FontAwesomeIcon icon={faRefresh} />
			<span>{$t$('pwa.updateAvailable')}</span>
		</div>
		<div class="update-actions">
			<Button onClick={handleUpdate} disabled={updating}>
				{#if updating}
					{$t$('pwa.updating')}
				{:else}
					{$t$('pwa.updateNow')}
				{/if}
			</Button>
			<button class="dismiss-btn" onclick={handleDismiss} aria-label="Dismiss">
				<FontAwesomeIcon icon={faTimes} />
			</button>
		</div>
	</div>
{/if}

<style>
	.update-banner {
		position: fixed;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 9999;
		background: var(--color-surface, #1a3a47);
		border: 1px solid var(--color-primary, #208eb8);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		max-width: calc(100% - 2rem);
	}

	.update-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text, #fff);
	}

	.update-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.dismiss-btn {
		background: transparent;
		border: none;
		color: var(--color-text-muted, #aaa);
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dismiss-btn:hover {
		color: var(--color-text, #fff);
	}

	@media (max-width: 480px) {
		.update-banner {
			flex-direction: column;
			gap: 0.75rem;
			text-align: center;
		}

		.update-actions {
			width: 100%;
			justify-content: center;
		}
	}
</style>
