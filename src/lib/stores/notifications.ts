import { writable } from 'svelte/store';

interface Notification {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
	unclosable?: boolean;
	timeout?: number | null;
}

function createNotificationStore() {
	const { subscribe, update } = writable<Notification[]>([]);

	const store = {
		subscribe,
		success: (message: string, timeout: number | null = 3000, unclosable: boolean = false) =>
			store.add({ type: 'success', message, timeout, unclosable }),
		info: (message: string, timeout: number | null = 3000, unclosable: boolean = false) =>
			store.add({ type: 'info', message, timeout, unclosable }),
		error: (message: string, timeout: number | null = 5000, unclosable: boolean = false) =>
			store.add({ type: 'error', message, timeout, unclosable }),
		warning: (message: string, timeout: number | null = 5000, unclosable: boolean = false) =>
			store.add({ type: 'warning', message, timeout, unclosable }),
		add: (notification: Omit<Notification, 'id'>) => {
			const id = crypto.randomUUID();
			update((notifications) => [...notifications, { ...notification, id }]);

			if (notification.timeout) {
				setTimeout(() => {
					store.remove(id);
				}, notification.timeout);
			}

			return id;
		},
		remove: (id: string) => {
			update((notifications) => notifications.filter((n) => n.id !== id));
		},
		clear: () => {
			update(() => []);
		}
	};

	return store;
}

export const notifications = createNotificationStore();
