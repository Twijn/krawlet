/**
 * Accessibility utilities for Krawlet
 * Provides focus management, screen reader announcements, and keyboard navigation helpers
 */

import { browser } from '$app/environment';

/**
 * Creates a focus trap within a dialog or modal element.
 * Ensures keyboard focus stays within the element while it's open.
 *
 * @param node - The container element to trap focus within
 * @returns Svelte action cleanup object
 *
 * @example
 * ```svelte
 * <div class="modal" use:trapFocus>
 *   <!-- Modal content -->
 * </div>
 * ```
 */
export function trapFocus(node: HTMLElement) {
	const focusableSelectors = [
		'a[href]',
		'button:not([disabled])',
		'textarea:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(', ');

	let previouslyFocused: HTMLElement | null = null;

	function getFocusableElements(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(focusableSelectors));
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;

		const focusableElements = getFocusableElements();
		if (focusableElements.length === 0) return;

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (event.shiftKey) {
			// Shift + Tab: going backwards
			if (document.activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus();
			}
		} else {
			// Tab: going forwards
			if (document.activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		}
	}

	// Store the previously focused element
	if (browser) {
		previouslyFocused = document.activeElement as HTMLElement;
	}

	// Focus the first focusable element or the container
	const focusableElements = getFocusableElements();
	if (focusableElements.length > 0) {
		focusableElements[0].focus();
	} else {
		node.setAttribute('tabindex', '-1');
		node.focus();
	}

	node.addEventListener('keydown', handleKeyDown);

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeyDown);
			// Return focus to the previously focused element
			if (previouslyFocused && previouslyFocused.focus) {
				previouslyFocused.focus();
			}
		}
	};
}

/**
 * Announces a message to screen readers using a live region.
 * Creates a temporary element that screen readers will read aloud.
 *
 * @param message - The message to announce
 * @param priority - 'polite' for non-urgent updates, 'assertive' for important/urgent updates
 *
 * @example
 * ```typescript
 * announce('Item copied to clipboard');
 * announce('Error: Invalid input', 'assertive');
 * ```
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
	if (!browser) return;

	// Find or create the live region
	let liveRegion = document.getElementById(`a11y-live-${priority}`);

	if (!liveRegion) {
		liveRegion = document.createElement('div');
		liveRegion.id = `a11y-live-${priority}`;
		liveRegion.setAttribute('aria-live', priority);
		liveRegion.setAttribute('aria-atomic', 'true');
		liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
		liveRegion.className = 'sr-only';
		document.body.appendChild(liveRegion);
	}

	// Clear and set the message (this triggers the announcement)
	liveRegion.textContent = '';
	// Use setTimeout to ensure the DOM update is processed
	setTimeout(() => {
		if (liveRegion) {
			liveRegion.textContent = message;
		}
	}, 100);
}

/**
 * Generates a unique ID for accessibility purposes.
 * Useful for associating labels with inputs.
 *
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 *
 * @example
 * ```typescript
 * const labelId = generateId('label'); // 'label-abc123def'
 * ```
 */
export function generateId(prefix: string = 'a11y'): string {
	return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Checks if the user prefers reduced motion.
 * Use this to disable or reduce animations.
 *
 * @returns true if the user prefers reduced motion
 *
 * @example
 * ```typescript
 * if (prefersReducedMotion()) {
 *   // Use simpler animations or none
 * }
 * ```
 */
export function prefersReducedMotion(): boolean {
	if (!browser) return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Svelte action to handle click outside of an element.
 * Useful for closing dropdowns and modals.
 *
 * @param node - The element to monitor
 * @param callback - Function to call when clicked outside
 * @returns Svelte action cleanup object
 *
 * @example
 * ```svelte
 * <div use:clickOutside={() => closeDropdown()}>
 *   <!-- Dropdown content -->
 * </div>
 * ```
 */
export function clickOutside(node: HTMLElement, callback: () => void) {
	function handleClick(event: MouseEvent) {
		if (node && !node.contains(event.target as Node)) {
			callback();
		}
	}

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}

/**
 * Svelte action to close element on Escape key press.
 *
 * @param node - The element to monitor
 * @param callback - Function to call when Escape is pressed
 * @returns Svelte action cleanup object
 *
 * @example
 * ```svelte
 * <div use:escapeKey={() => closeModal()}>
 *   <!-- Modal content -->
 * </div>
 * ```
 */
export function escapeKey(_node: HTMLElement, callback: () => void) {
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			callback();
		}
	}

	document.addEventListener('keydown', handleKeyDown, true);

	return {
		destroy() {
			document.removeEventListener('keydown', handleKeyDown, true);
		}
	};
}

/**
 * Manages focus for a list of items (e.g., menu items, options).
 * Handles arrow key navigation.
 *
 * @param node - The container element
 * @param options - Configuration options
 * @returns Svelte action cleanup object
 *
 * @example
 * ```svelte
 * <ul use:roving={{ selector: 'li' }}>
 *   <li tabindex="-1">Item 1</li>
 *   <li tabindex="-1">Item 2</li>
 * </ul>
 * ```
 */
export function roving(
	node: HTMLElement,
	options: { selector: string; wrap?: boolean } = { selector: '[role="option"]', wrap: true }
) {
	const { selector, wrap = true } = options;

	function getItems(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(selector));
	}

	function handleKeyDown(event: KeyboardEvent) {
		const items = getItems();
		if (items.length === 0) return;

		const currentIndex = items.findIndex((item) => item === document.activeElement);
		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowRight':
				event.preventDefault();
				newIndex = currentIndex + 1;
				if (newIndex >= items.length) {
					newIndex = wrap ? 0 : items.length - 1;
				}
				break;
			case 'ArrowUp':
			case 'ArrowLeft':
				event.preventDefault();
				newIndex = currentIndex - 1;
				if (newIndex < 0) {
					newIndex = wrap ? items.length - 1 : 0;
				}
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = items.length - 1;
				break;
		}

		if (newIndex !== currentIndex && items[newIndex]) {
			items[newIndex].focus();
		}
	}

	node.addEventListener('keydown', handleKeyDown);

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeyDown);
		}
	};
}
