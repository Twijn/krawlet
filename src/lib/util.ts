/**
 * Utility functions for common operations throughout the application.
 * @module util
 */

/**
 * Time unit configuration for relative time calculations.
 * Each unit defines the threshold (in seconds) at which to use the next larger unit,
 * the divisor to calculate the value, and singular/plural labels.
 */
const timeUnits = [
	{ threshold: 60, divisor: 1, singular: 'second', plural: 'seconds' },
	{ threshold: 3600, divisor: 60, singular: 'minute', plural: 'minutes' },
	{ threshold: 86400, divisor: 3600, singular: 'hour', plural: 'hours' },
	{ threshold: 2592000, divisor: 86400, singular: 'day', plural: 'days' },
	{ threshold: 31536000, divisor: 2592000, singular: 'month', plural: 'months' },
	{ threshold: Infinity, divisor: 31536000, singular: 'year', plural: 'years' }
];

/**
 * Converts a Date object to a human-readable relative time string.
 *
 * @param {Date} date - The date to convert to relative time
 * @returns {string} A human-readable string like "5 minutes ago" or "2 days ago"
 *
 * @example
 * const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
 * relativeTime(fiveMinutesAgo); // "5 minutes ago"
 *
 * @example
 * const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
 * relativeTime(yesterday); // "1 day ago"
 */
export const relativeTime = (date: Date): string => {
	const now = new Date();
	const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

	const unit = timeUnits.find((unit) => diff < unit.threshold);
	if (!unit) return 'a long time ago';

	const value = Math.floor(diff / unit.divisor);
	const label = value === 1 ? unit.singular : unit.plural;

	return `${value} ${label} ago`;
};

/**
 * Formats a number as a currency string with locale-aware formatting.
 * Uses the user's locale for number formatting (thousands separators, etc.)
 * and ensures a minimum of 2 decimal places.
 *
 * @param {number} balance - The number to format as currency
 * @returns {string} The formatted currency string (without currency symbol)
 *
 * @example
 * formatCurrency(1234.5); // "1,234.50" (in en-US locale)
 *
 * @example
 * formatCurrency(1000000); // "1,000,000.00" (in en-US locale)
 */
export const formatCurrency = (balance: number): string => {
	return Number(balance).toLocaleString(undefined, {
		minimumFractionDigits: 2
	});
};
