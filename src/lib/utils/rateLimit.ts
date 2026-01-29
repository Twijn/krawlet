/**
 * Rate limit handling utilities with exponential backoff
 */

import { browser } from '$app/environment';

// Default rate limit values for unauthenticated users
const DEFAULT_INITIAL_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BATCH_DELAY = 200; // 200ms between batches

// Rate limit values for authenticated users (with API key)
const AUTH_INITIAL_DELAY = 300; // 300ms
const AUTH_MAX_DELAY = 10000; // 10 seconds
const AUTH_MAX_RETRIES = 3;
const AUTH_BATCH_DELAY = 50; // 50ms between batches

/**
 * Check if the user has a valid Krawlet API key configured
 * Only API keys starting with 'kraw_' are considered valid
 */
function hasApiKey(): boolean {
	if (!browser) return false;
	try {
		const settings = localStorage.getItem('settings');
		if (settings) {
			const parsed = JSON.parse(settings);
			const apiKey = parsed.krawletApiKey;
			return typeof apiKey === 'string' && apiKey.startsWith('kraw_');
		}
	} catch {
		// Ignore parse errors
	}
	return false;
}

/**
 * Get rate limit configuration based on authentication status
 */
export function getRateLimitConfig() {
	const authenticated = hasApiKey();
	return {
		initialDelay: authenticated ? AUTH_INITIAL_DELAY : DEFAULT_INITIAL_DELAY,
		maxDelay: authenticated ? AUTH_MAX_DELAY : DEFAULT_MAX_DELAY,
		maxRetries: authenticated ? AUTH_MAX_RETRIES : DEFAULT_MAX_RETRIES,
		batchDelay: authenticated ? AUTH_BATCH_DELAY : DEFAULT_BATCH_DELAY,
		authenticated
	};
}

interface RetryOptions {
	initialDelay?: number;
	maxDelay?: number;
	maxRetries?: number;
	onRetry?: (attempt: number, delay: number) => void;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a rate limit error (429 Too Many Requests)
 */
function isRateLimitError(error: unknown): boolean {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		if (message.includes('429') || message.includes('too many') || message.includes('rate limit')) {
			return true;
		}
	}
	// Check for fetch Response-like objects
	if (error && typeof error === 'object' && 'status' in error) {
		return (error as { status: number }).status === 429;
	}
	return false;
}

/**
 * Execute a function with automatic retry on rate limit errors
 * Uses exponential backoff with jitter
 * Automatically uses shorter delays when user is authenticated with an API key
 */
export async function withRateLimitRetry<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const config = getRateLimitConfig();
	const {
		initialDelay = config.initialDelay,
		maxDelay = config.maxDelay,
		maxRetries = config.maxRetries,
		onRetry
	} = options;

	let lastError: unknown;
	let delay = initialDelay;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			if (!isRateLimitError(error) || attempt === maxRetries) {
				throw error;
			}

			// Add jitter (±25%)
			const jitter = delay * 0.25 * (Math.random() * 2 - 1);
			const actualDelay = Math.min(delay + jitter, maxDelay);

			if (onRetry) {
				onRetry(attempt + 1, actualDelay);
			}

			console.warn(
				`Rate limited, retrying in ${Math.round(actualDelay)}ms (attempt ${attempt + 1}/${maxRetries})`
			);

			await sleep(actualDelay);

			// Exponential backoff
			delay = Math.min(delay * 2, maxDelay);
		}
	}

	throw lastError;
}

/**
 * Create a rate-limited version of an async function
 * Adds a minimum delay between calls to avoid hitting rate limits
 */
export function createRateLimitedFn<T extends (...args: unknown[]) => Promise<unknown>>(
	fn: T,
	minDelayMs: number = 100
): T {
	let lastCallTime = 0;

	return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
		const now = Date.now();
		const timeSinceLastCall = now - lastCallTime;

		if (timeSinceLastCall < minDelayMs) {
			await sleep(minDelayMs - timeSinceLastCall);
		}

		lastCallTime = Date.now();
		return fn(...args) as ReturnType<T>;
	}) as T;
}

/**
 * Simple delay helper - waits for a specified time
 * Automatically uses shorter delays when user is authenticated with an API key
 * @param ms - Optional delay in milliseconds. If not provided, uses default based on auth status.
 */
export async function rateLimitDelay(ms?: number): Promise<void> {
	const config = getRateLimitConfig();
	const actualDelay = ms ?? config.batchDelay;
	await sleep(actualDelay);
}

/**
 * Batch delay helper - adds delay between iterations in a loop
 * Use this in while loops that make API calls
 * Automatically uses shorter delays when user is authenticated with an API key
 */
export async function batchDelay(
	currentIteration: number,
	delayEveryN: number = 5,
	delayMs?: number
): Promise<void> {
	const config = getRateLimitConfig();
	const actualDelay = delayMs ?? config.batchDelay;
	if (currentIteration > 0 && currentIteration % delayEveryN === 0) {
		await sleep(actualDelay);
	}
}
