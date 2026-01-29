import { writable } from 'svelte/store';

interface PromptMessage {
	type: 'password' | 'text';
	message: string;
	danger?: boolean;
	inputLabel: string;
	confirmButtonLabel?: string;
	cancelButtonLabel?: string;
	confirm: (value: string) => void;
	cancel?: () => void;
	/**
	 * Return an array of error messages.
	 * @param value
	 */
	validate?: (value: string) => Promise<string[]>;
	errors?: string[];
}

function createPromptStore() {
	const { subscribe, update } = writable<PromptMessage | null>(null);

	return {
		subscribe,
		prompt: (
			message: Omit<PromptMessage, 'errors' | 'confirm' | 'cancel'> & {
				confirm?: (value: string) => void;
				cancel?: () => void;
			}
		): Promise<string | null> => {
			return new Promise((resolve) => {
				const handle = async (result: string | null) => {
					if (result) {
						if (message.validate) {
							const errors = await message.validate(result);
							if (errors.length > 0) {
								update((current) => ({
									...current!,
									errors
								}));
								return;
							}
						}
						message.confirm?.(result);
						update(() => null);
						resolve(result);
					} else {
						message.cancel?.();
						update(() => null);
						resolve(null);
					}
				};
				update(() => {
					return {
						...message,
						confirm: (result) => handle(result),
						cancel: () => handle(null)
					};
				});
			});
		},
		clearErrors: () => {
			update((current) => {
				if (current) {
					return {
						...current,
						errors: []
					};
				}
				return current;
			});
		}
	};
}

export const prompt = createPromptStore();
