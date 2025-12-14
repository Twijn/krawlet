import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import en from './locales/en';
import es from './locales/es';

/**
 * Available locales in the application
 */
export const LOCALES = {
	en: { name: 'English', nativeName: 'English' },
	es: { name: 'Spanish', nativeName: 'Español' }
} as const;

export type LocaleCode = keyof typeof LOCALES;

/**
 * Type for nested translation keys
 */
type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = { [key: string]: TranslationValue };

/**
 * All available translations
 */
const translations: Record<LocaleCode, Translations> = {
	en,
	es
};

/**
 * Current locale store - using $state for Svelte 5 reactivity
 */
export const locale = writable<LocaleCode>('en');

// Keep track of current locale value for reactive access
let currentLocale: LocaleCode = 'en';
locale.subscribe((value) => {
	currentLocale = value;
});

/**
 * Get current locale value reactively
 */
export function getLocale(): LocaleCode {
	return currentLocale;
}

/**
 * Initialize locale from settings or browser preference
 */
export function initLocale(savedLocale?: string) {
	if (savedLocale && savedLocale in translations) {
		locale.set(savedLocale as LocaleCode);
	} else if (browser) {
		// Try to detect browser language
		const browserLang = navigator.language.split('-')[0];
		if (browserLang in translations) {
			locale.set(browserLang as LocaleCode);
		}
	}
}

/**
 * Get a nested value from an object using dot notation
 * @param obj - The object to traverse
 * @param path - Dot-notated path (e.g., 'nav.home')
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(obj: Translations, path: string): string | undefined {
	const keys = path.split('.');
	let current: TranslationValue | undefined = obj;

	for (const key of keys) {
		if (current && typeof current === 'object' && key in current) {
			current = current[key];
		} else {
			return undefined;
		}
	}

	return typeof current === 'string' ? current : undefined;
}

/**
 * Interpolate variables in a translation string
 * @param str - The translation string with placeholders like {name}
 * @param vars - Object with variable values
 * @returns Interpolated string
 * @example
 * interpolate('Hello, {name}!', { name: 'World' }) // 'Hello, World!'
 */
function interpolate(str: string, vars: Record<string, string | number>): string {
	return str.replace(/\{(\w+)\}/g, (_, key) => {
		return key in vars ? String(vars[key]) : `{${key}}`;
	});
}

/**
 * Translation function - gets a translation by key with optional interpolation
 * This function reads from the tracked currentLocale variable which updates
 * when the locale store changes, enabling reactive translations.
 * @param key - Dot-notated translation key (e.g., 'nav.home')
 * @param vars - Optional variables for interpolation
 * @returns Translated string, or the key if not found
 * @example
 * t('nav.home') // 'Home'
 * t('greeting', { name: 'User' }) // 'Hello, User!'
 */
export function t(key: string, vars?: Record<string, string | number>): string {
	// Use the tracked currentLocale instead of get(locale) for reactivity
	const localeCode = currentLocale;

	// Try current locale first
	let translation = getNestedValue(translations[localeCode], key);

	// Fallback to English if not found
	if (translation === undefined && localeCode !== 'en') {
		translation = getNestedValue(translations.en, key);
	}

	// Return key if translation not found
	if (translation === undefined) {
		console.warn(`Missing translation for key: ${key}`);
		return key;
	}

	// Interpolate variables if provided
	if (vars) {
		return interpolate(translation, vars);
	}

	return translation;
}

/**
 * Reactive translation store - updates when locale changes
 * Use this in components for reactive translations: $t$(key)
 * 
 * @example
 * <script>
 *   import { t$ } from '$lib/i18n';
 * </script>
 * <h1>{$t$('nav.home')}</h1>
 */
export const t$ = derived(locale, ($locale) => {
	return (key: string, vars?: Record<string, string | number>): string => {
		let translation = getNestedValue(translations[$locale], key);

		if (translation === undefined && $locale !== 'en') {
			translation = getNestedValue(translations.en, key);
		}

		if (translation === undefined) {
			return key;
		}

		if (vars) {
			return interpolate(translation, vars);
		}

		return translation;
	};
});
