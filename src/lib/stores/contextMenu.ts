import { writable } from 'svelte/store';
import type { ContextMenuItem } from '$lib/components/ui/ContextMenu.svelte';

interface ContextMenuState {
	visible: boolean;
	x: number;
	y: number;
	items: ContextMenuItem[];
}

const initialState: ContextMenuState = {
	visible: false,
	x: 0,
	y: 0,
	items: []
};

function createContextMenuStore() {
	const { subscribe, set, update } = writable<ContextMenuState>(initialState);

	return {
		subscribe,
		show: (x: number, y: number, items: ContextMenuItem[]) => {
			set({ visible: true, x, y, items });
		},
		hide: () => {
			set(initialState);
		}
	};
}

export const contextMenu = createContextMenuStore();
