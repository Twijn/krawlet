const timeUnits = [
	{ threshold: 60, divisor: 1, singular: 'second', plural: 'seconds' },
	{ threshold: 3600, divisor: 60, singular: 'minute', plural: 'minutes' },
	{ threshold: 86400, divisor: 3600, singular: 'hour', plural: 'hours' },
	{ threshold: 2592000, divisor: 86400, singular: 'day', plural: 'days' },
	{ threshold: 31536000, divisor: 2592000, singular: 'month', plural: 'months' },
	{ threshold: Infinity, divisor: 31536000, singular: 'year', plural: 'years' }
];

export const relativeTime = (date: Date): string => {
	const now = new Date();
	const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

	const unit = timeUnits.find((unit) => diff < unit.threshold);
	if (!unit) return 'a long time ago';

	const value = Math.floor(diff / unit.divisor);
	const label = value === 1 ? unit.singular : unit.plural;

	return `${value} ${label} ago`;
};

export const formatCurrency = (balance: number): string => {
	return balance.toLocaleString(undefined, { minimumSignificantDigits: 2 });
};
