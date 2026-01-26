<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { confirm } from '$lib/stores/confirm';
	import Button from '$lib/components/ui/Button.svelte';
	import { trapFocus } from '$lib/utils/a11y';
	import { t$ } from '$lib/i18n';

	let dialogElement: HTMLDivElement | null = $state(null);
	const dialogId = 'confirm-dialog';
	const titleId = `${dialogId}-title`;
	const descId = `${dialogId}-desc`;

	const handleClickOutside = (node: HTMLElement) => {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node)) {
				$confirm?.cancel?.();
			}
		};

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.stopPropagation();
				$confirm?.cancel?.();
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

{#if $confirm}
	<div class="modal-backdrop" transition:fade={{ duration: 120 }}>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={descId}
			transition:scale={{ duration: 120, start: 0.95 }}
			use:handleClickOutside
			use:trapFocus
			bind:this={dialogElement}
		>
			<h2 id={titleId} class="sr-only">{$t$('common.confirm')}</h2>
			<p id={descId} class="modal-message">{$confirm.message}</p>
			<div class="modal-buttons">
				<Button variant="secondary" type="button" onClick={() => $confirm.cancel?.()}>
					{$confirm.cancelButtonLabel ?? $t$('common.cancel')}
				</Button>
				<Button
					variant={$confirm.danger ? 'error' : 'primary'}
					type="button"
					onClick={() => $confirm.confirm()}
				>
					{$confirm.confirmButtonLabel ?? $t$('common.confirm')}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(1px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
	}

	.modal {
		background: var(--background-color-2);
		padding: 1.5rem;
		border-radius: 1rem;
		max-width: 400px;
		width: calc(100% - 4rem);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
		text-align: center;
	}

	.modal-message {
		margin-bottom: 1.5rem;
		font-size: 1.1rem;
		font-weight: 500;
	}

	.modal-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
