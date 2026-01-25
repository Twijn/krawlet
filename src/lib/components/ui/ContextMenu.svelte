<script lang="ts">
	import { scale } from 'svelte/transition';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	export interface ContextMenuItem {
		label: string;
		icon?: IconDefinition;
		href?: string;
		action?: () => void;
		disabled?: boolean;
		separator?: boolean;
	}

	const {
		items = [],
		x = 0,
		y = 0,
		visible = false,
		onClose
	}: {
		items: ContextMenuItem[];
		x: number;
		y: number;
		visible: boolean;
		onClose: () => void;
	} = $props();

	let menuElement: HTMLDivElement | null = $state(null);
	let adjustedX = $state(x);
	let adjustedY = $state(y);

	// Adjust position to keep menu on screen
	$effect(() => {
		if (visible && menuElement) {
			const rect = menuElement.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Adjust X if menu goes off right edge
			if (x + rect.width > viewportWidth - 10) {
				adjustedX = viewportWidth - rect.width - 10;
			} else {
				adjustedX = x;
			}

			// Adjust Y if menu goes off bottom edge
			if (y + rect.height > viewportHeight - 10) {
				adjustedY = viewportHeight - rect.height - 10;
			} else {
				adjustedY = y;
			}
		}
	});

	// Set up and tear down event listeners based on visibility
	$effect(() => {
		if (!visible) return;

		const handleClickOutside = (event: MouseEvent) => {
			// Don't close if clicking inside the menu
			if (menuElement && menuElement.contains(event.target as Node)) {
				return;
			}
			onClose();
		};

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		const handleContextMenu = (event: MouseEvent) => {
			// If right-clicking outside the menu, close it (the new contextmenu handler will open a new one)
			if (menuElement && !menuElement.contains(event.target as Node)) {
				onClose();
			}
		};

		const handleScroll = () => {
			onClose();
		};

		// Add listeners after a microtask to avoid catching the event that opened the menu
		const timeoutId = setTimeout(() => {
			document.addEventListener('click', handleClickOutside, true);
			document.addEventListener('mousedown', handleClickOutside, true);
			document.addEventListener('keydown', handleKeydown);
			document.addEventListener('contextmenu', handleContextMenu, true);
			window.addEventListener('scroll', handleScroll, true);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('click', handleClickOutside, true);
			document.removeEventListener('mousedown', handleClickOutside, true);
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('contextmenu', handleContextMenu, true);
			window.removeEventListener('scroll', handleScroll, true);
		};
	});

	const handleItemClick = (item: ContextMenuItem) => {
		if (item.disabled) return;
		if (item.action) {
			item.action();
		}
		onClose();
	};
</script>

{#if visible}
	<div
		class="context-menu"
		style="left: {adjustedX}px; top: {adjustedY}px;"
		bind:this={menuElement}
		role="menu"
		tabindex="-1"
		transition:scale={{ duration: 100, start: 0.95, opacity: 0 }}
	>
		{#each items as item}
			{#if item.separator}
				<div class="separator" role="separator"></div>
			{:else if item.href}
				<a
					href={item.href}
					class="menu-item"
					class:disabled={item.disabled}
					role="menuitem"
					tabindex={item.disabled ? -1 : 0}
					onclick={() => onClose()}
				>
					{#if item.icon}
						<span class="icon">
							<FontAwesomeIcon icon={item.icon} />
						</span>
					{/if}
					<span class="label">{item.label}</span>
				</a>
			{:else}
				<button
					type="button"
					class="menu-item"
					class:disabled={item.disabled}
					role="menuitem"
					tabindex={item.disabled ? -1 : 0}
					onclick={() => handleItemClick(item)}
					disabled={item.disabled}
				>
					{#if item.icon}
						<span class="icon">
							<FontAwesomeIcon icon={item.icon} />
						</span>
					{/if}
					<span class="label">{item.label}</span>
				</button>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.context-menu {
		position: fixed;
		z-index: 10000;
		background-color: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		box-shadow:
			0 10px 40px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(255, 255, 255, 0.05);
		min-width: 180px;
		padding: 0.35rem;
		overflow: hidden;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.6rem 0.75rem;
		background: transparent;
		border: none;
		color: var(--text-color-1);
		font-size: 0.9rem;
		font-family: inherit;
		text-decoration: none;
		cursor: pointer;
		border-radius: 0.35rem;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
		text-align: left;
	}

	.menu-item:hover:not(.disabled),
	.menu-item:focus-visible:not(.disabled) {
		background-color: rgba(var(--theme-color-rgb), 0.2);
		color: white;
	}

	.menu-item.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.icon {
		width: 1rem;
		text-align: center;
		opacity: 0.7;
	}

	.menu-item:hover:not(.disabled) .icon,
	.menu-item:focus-visible:not(.disabled) .icon {
		opacity: 1;
	}

	.label {
		flex: 1;
	}

	.separator {
		height: 1px;
		background-color: rgba(255, 255, 255, 0.1);
		margin: 0.35rem 0.5rem;
	}
</style>
