import { goto } from '$app/navigation';
import { page } from '$app/state';
import { SvelteURL } from 'svelte/reactivity';

export function paramState<T>(
	paramName: string,
	defaultValue: T,
	options: {
		serialize?: (value: T) => string;
		deserialize?: (value: string) => T;
		shouldSet?: (value: T) => boolean;
	} = {}
) {
	const {
		serialize = (value: T) => String(value),
		deserialize = (value: string) => value as T,
		shouldSet = (value: T) => value !== defaultValue
	} = options;

	// Get initial value from URL params
	const urlValue = page.url.searchParams.get(paramName);
	let currentValue = $state(urlValue ? deserialize(urlValue) : defaultValue);

	// Update URL when value changes
	$effect(() => {
		const url = new SvelteURL(window.location.href);

		if (shouldSet(currentValue)) {
			url.searchParams.set(paramName, serialize(currentValue));
		} else {
			url.searchParams.delete(paramName);
		}

		goto(url.toString(), {
			replaceState: true,
			keepFocus: true,
			noScroll: true,
			invalidateAll: false
		});
	});

	return {
		get value() {
			return currentValue;
		},
		set value(newValue: T) {
			currentValue = newValue;
		}
	};
}
