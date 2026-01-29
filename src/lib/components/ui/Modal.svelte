<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
	import { trapFocus } from '$lib/utils/a11y';
	import { t$ } from '$lib/i18n';
	import type { Snippet } from 'svelte';

	const {
		open = false,
		title = '',
		onClose,
		maxWidth = '500px',
		children
	}: {
		open: boolean;
		title?: string;
		onClose: () => void;
		maxWidth?: string;
		children: Snippet;
	} = $props();

	let dialogElement: HTMLDivElement | null = $state(null);
	const dialogId = `modal-${Math.random().toString(36).substring(7)}`;
	const titleId = `${dialogId}-title`;

	const handleClickOutside = (node: HTMLElement) => {
		const handleClick = (event: MouseEvent) => {
			const target = event.target as Node;

			// Don't close if target is no longer in the document (was in a now-closed modal)
			if (!document.body.contains(target)) {
				return;
			}

			// Don't close if clicking inside this modal
			if (node && node.contains(target)) {
				return;
			}

			// Don't close if clicking inside another modal (prompt, confirm, etc.)
			const closestBackdrop = (target as Element).closest?.('.modal-backdrop');
			if (closestBackdrop && closestBackdrop !== node.parentElement) {
				return;
			}

			// Close if clicking outside (on this modal's backdrop or elsewhere)
			onClose();
		};

		const handleKeydown = (event: KeyboardEvent) => {
			// Don't close on Escape if another modal is open on top
			const hasOtherModalOpen = document.querySelectorAll('.modal-backdrop').length > 1;
			if (event.key === 'Escape' && !hasOtherModalOpen) {
				onClose();
			}
		};

		document.addEventListener('click', handleClick, true);
		document.addEventListener('keydown', handleKeydown, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
				document.removeEventListener('keydown', handleKeydown, true);
			}
		};
	};
</script>

{#if open}
	<div class="modal-backdrop" transition:fade={{ duration: 120 }}>
		<div
			class="modal"
			style="max-width: {maxWidth}"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			transition:scale={{ duration: 120, start: 0.95 }}
			use:handleClickOutside
			use:trapFocus
			bind:this={dialogElement}
		>
			{#if title}
				<div class="modal-header">
					<h2 id={titleId}>{title}</h2>
					<button class="close-btn" onclick={onClose} aria-label={$t$('common.close')}>
						<FontAwesomeIcon icon={faTimes} />
					</button>
				</div>
			{:else}
				<button class="close-btn absolute" onclick={onClose} aria-label={$t$('common.close')}>
					<FontAwesomeIcon icon={faTimes} />
				</button>
			{/if}

			<div class="modal-content">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: var(--background-color-2);
		padding: 1.5rem;
		border-radius: 0.75rem;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		width: calc(100% - 4rem);
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--text-color-1);
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-color-2);
		cursor: pointer;
		padding: 0.5rem;
		font-size: 1.25rem;
		transition: color 0.2s ease;
	}

	.close-btn:hover,
	.close-btn:focus {
		color: var(--text-color-1);
	}

	.close-btn.absolute {
		position: absolute;
		top: 1rem;
		right: 1rem;
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media only screen and (max-width: 768px) {
		.modal {
			padding: 1rem;
			width: calc(100% - 2rem);
		}
	}
</style>
