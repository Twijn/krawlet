import { goto } from '$app/navigation';
import { page } from '$app/state';
import { SvelteURL } from 'svelte/reactivity';

const pendingParamUpdates = new Map<string, string | null>();
let flushScheduled = false;

function scheduleUrlParamFlush() {
	if (flushScheduled || typeof window === 'undefined') return;
	flushScheduled = true;

	queueMicrotask(() => {
		flushScheduled = false;
		if (pendingParamUpdates.size === 0) return;

		const url = new SvelteURL(window.location.href);
		for (const [key, value] of pendingParamUpdates.entries()) {
			if (value === null) {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, value);
			}
		}
		pendingParamUpdates.clear();

		if (url.toString() === window.location.href) return;

		goto(url.toString(), {
			replaceState: true,
			keepFocus: true,
			noScroll: true,
			invalidateAll: false
		});
	});
}

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
		if (typeof window === 'undefined') return;

		pendingParamUpdates.set(paramName, shouldSet(currentValue) ? serialize(currentValue) : null);
		scheduleUrlParamFlush();
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
