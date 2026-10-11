import { writable, get } from 'svelte/store';
import settings from '$lib/stores/settings';

export type ResolveHandle = (value: string) => void;
export type RejectHandle = (error: Error) => void;
export type GetMasterPasswordHandle = [ResolveHandle, RejectHandle];

const createMasterPasswordStore = () => {
	const passwordStore = writable<string | null>(null);
	const promptForPassword = writable<boolean>(false);
	const error = writable<string | null>(null);

	let getHandles: GetMasterPasswordHandle[] = [];

	return {
		promptForPassword,
		error,
		set: async (password: string, persist: boolean): Promise<boolean> => {
			error.set(null);

			const isValid = await settings.validateMasterPassword(password);
			if (!isValid) {
				error.set('Invalid master password');
				return false;
			}

			promptForPassword.set(false);
			getHandles.forEach((handle) => handle[0](password));
			getHandles = [];

			if (persist) {
				passwordStore.set(password);
			}
			return true;
		},
		cancel: () => {
			promptForPassword.set(false);
			error.set(null);
			getHandles.forEach((handle) => handle[1](new Error('Master password entry cancelled')));
			getHandles = [];
		},
		clearError: () => {
			error.set(null);
		},
		clear: () => {
			passwordStore.set(null);
			// promptForPassword.set(false); // not sure I want this or not yet
		},
		get: (): Promise<string> => {
			return new Promise((resolve, reject) => {
				const password = get(passwordStore);
				if (!password) {
					promptForPassword.set(true);
					getHandles.push([resolve, reject]);
				} else {
					resolve(password);
				}
			});
		}
	};
};

export const masterPasswordStore = createMasterPasswordStore();
