import { browser } from '$app/environment';
import krawletClient, { isValidApiKey } from '$lib/api/krawlet';
import settings from '$lib/stores/settings';
import { get, writable } from 'svelte/store';

type ApiKeyInfoBase = Awaited<ReturnType<typeof krawletClient.apiKey.getInfo>>;

export type ApiKeyInfo = ApiKeyInfoBase;

export type ApiKeyInfoState = {
	info: ApiKeyInfo | null;
	mcUuid: string | null;
	mcName: string | null;
	loading: boolean;
	error: string | null;
	loadedForKey: string | null;
	lastFetchedAt: number | null;
};

const initialState: ApiKeyInfoState = {
	info: null,
	mcUuid: null,
	mcName: null,
	loading: false,
	error: null,
	loadedForKey: null,
	lastFetchedAt: null
};

function getMinecraftIdentity(info: ApiKeyInfo): { mcUuid: string | null; mcName: string | null } {
	const withMinecraft = info as ApiKeyInfo & { mcUuid?: unknown; mcName?: unknown };
	return {
		mcUuid: typeof withMinecraft.mcUuid === 'string' ? withMinecraft.mcUuid : null,
		mcName: typeof withMinecraft.mcName === 'string' ? withMinecraft.mcName : null
	};
}

function createApiKeyInfoStore() {
	const data = writable<ApiKeyInfoState>({ ...initialState });
	let inFlight: Promise<ApiKeyInfo | null> | null = null;

	function clear() {
		inFlight = null;
		data.set({ ...initialState });
	}

	async function ensureLoaded(options?: { force?: boolean }): Promise<ApiKeyInfo | null> {
		const force = options?.force ?? false;
		const apiKey = get(settings).krawletApiKey?.trim() ?? '';

		if (!apiKey || !isValidApiKey(apiKey)) {
			clear();
			return null;
		}

		const state = get(data);
		if (!force && state.loadedForKey === apiKey && (state.info || state.error)) {
			return state.info;
		}

		if (inFlight) {
			return inFlight;
		}

		data.update((current) => ({
			...current,
			loading: true,
			error: null
		}));

		const requestKey = apiKey;
		inFlight = (async () => {
			try {
				const info = await krawletClient.apiKey.getInfo({ usage: true });
				const { mcUuid, mcName } = getMinecraftIdentity(info);
				if ((get(settings).krawletApiKey?.trim() ?? '') !== requestKey) {
					return null;
				}
				data.set({
					info,
					mcUuid,
					mcName,
					loading: false,
					error: null,
					loadedForKey: requestKey,
					lastFetchedAt: Date.now()
				});
				return info;
			} catch (err: unknown) {
				if ((get(settings).krawletApiKey?.trim() ?? '') !== requestKey) {
					return null;
				}
				data.set({
					info: null,
					mcUuid: null,
					mcName: null,
					loading: false,
					error: err instanceof Error ? err.message : 'Failed to fetch API key info',
					loadedForKey: requestKey,
					lastFetchedAt: Date.now()
				});
				return null;
			} finally {
				inFlight = null;
			}
		})();

		return inFlight;
	}

	if (browser) {
		let previousApiKey = get(settings).krawletApiKey;
		settings.subscribe((s) => {
			if (s.krawletApiKey !== previousApiKey) {
				previousApiKey = s.krawletApiKey;
				clear();
			}
		});
	}

	return {
		subscribe: data.subscribe,
		ensureLoaded,
		clear,
		refresh: () => ensureLoaded({ force: true })
	};
}

const apiKeyInfo = createApiKeyInfoStore();

export default apiKeyInfo;
