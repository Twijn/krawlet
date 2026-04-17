import { writable } from 'svelte/store';

const createMasterPasswordStore = () => {
	const { set } = writable<string | null>(null);

	return {
		set: (password: string) => {
			set(password);
		},
		clear: () => {
			set(null);
		}
	};
};

export const masterPasswordStore = createMasterPasswordStore();
