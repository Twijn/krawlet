<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import SettingsFieldset from '$lib/components/ui/SettingsFieldset.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { t, t$ } from '$lib/i18n';
	import { notifications } from '$lib/stores/notifications';
	import { confirm } from '$lib/stores/confirm';
	import { getDB } from '$lib/cache';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faDatabase,
		faHardDrive,
		faArrowsRotate,
		faTrash,
		faTrashCan,
		faBoxArchive,
		faBolt
	} from '@fortawesome/free-solid-svg-icons';

	type IndexedDbStoreStat = {
		id: string;
		name: string;
		entries: number;
		bytes: number;
	};

	type LocalStorageCacheStat = {
		id: string;
		key: string;
		entries: number;
		bytes: number;
		updated: number | null;
	};

	type ServiceWorkerCacheStat = {
		id: string;
		name: string;
		entries: number;
	};

	type CacheSummary = {
		entries: number;
		bytes: number;
		stores: number;
	};

	type CacheHealth = {
		level: 'good' | 'warn';
		message: string;
	};

	const LOCAL_STORAGE_CACHE_KEYS = ['known-addresses', 'player-wallets', 'shopsync'];

	let loading = $state(true);
	let actionId = $state<string | null>(null);
	let indexedDbStores = $state<IndexedDbStoreStat[]>([]);
	let localStorageCaches = $state<LocalStorageCacheStat[]>([]);
	let serviceWorkerCaches = $state<ServiceWorkerCacheStat[]>([]);

	const indexedDbSummary = $derived(bySummary(indexedDbStores));
	const localStorageSummary = $derived(bySummary(localStorageCaches));
	const serviceWorkerSummary = $derived({
		entries: serviceWorkerCaches.reduce((sum, cache) => sum + cache.entries, 0),
		bytes: 0,
		stores: serviceWorkerCaches.length
	});

	const totalEntries = $derived(
		indexedDbSummary.entries + localStorageSummary.entries + serviceWorkerSummary.entries
	);
	const totalBytes = $derived(indexedDbSummary.bytes + localStorageSummary.bytes);

	const cacheHealth = $derived(getCacheHealth(totalBytes, totalEntries));

	function bySummary(entries: Array<{ entries: number; bytes: number }>): CacheSummary {
		return {
			entries: entries.reduce((sum, item) => sum + item.entries, 0),
			bytes: entries.reduce((sum, item) => sum + item.bytes, 0),
			stores: entries.length
		};
	}

	function getCacheHealth(bytes: number, entries: number): CacheHealth {
		if (bytes > 50_000_000 || entries > 50_000) {
			return {
				level: 'warn',
				message: t('settings.cacheHealthHeavy')
			};
		}

		return {
			level: 'good',
			message: t('settings.cacheHealthGood')
		};
	}

	function bytesToHuman(bytes: number): string {
		if (bytes <= 0) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB'];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex += 1;
		}

		return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[unitIndex]}`;
	}

	function formatUpdatedAt(timestamp: number | null): string {
		if (!timestamp) return t('settings.cacheNever');
		return new Date(timestamp).toLocaleString();
	}

	async function loadCacheStats() {
		if (!browser) return;

		loading = true;
		try {
			const [idbStats, localStats, swStats] = await Promise.all([
				getIndexedDbStats(),
				getLocalStorageStats(),
				getServiceWorkerCacheStats()
			]);

			indexedDbStores = idbStats;
			localStorageCaches = localStats;
			serviceWorkerCaches = swStats;
		} catch (err) {
			console.error('Failed to load cache stats:', err);
			notifications.error(t('settings.cacheStatsFailed'));
		} finally {
			loading = false;
		}
	}

	async function getIndexedDbStats(): Promise<IndexedDbStoreStat[]> {
		const db = await getDB();
		const storeNames = Array.from(db.objectStoreNames);

		return Promise.all(
			storeNames.map(async (storeName) => {
				const [count, rows] = await Promise.all([db.count(storeName), db.getAll(storeName)]);
				return {
					id: storeName,
					name: storeName,
					entries: count,
					bytes: new Blob([JSON.stringify(rows)]).size
				};
			})
		);
	}

	async function getLocalStorageStats(): Promise<LocalStorageCacheStat[]> {
		const stats: LocalStorageCacheStat[] = [];

		for (const key of LOCAL_STORAGE_CACHE_KEYS) {
			const raw = localStorage.getItem(key);
			if (!raw) {
				stats.push({
					id: key,
					key,
					entries: 0,
					bytes: 0,
					updated: null
				});
				continue;
			}

			let entries = 0;
			let updated: number | null = null;

			try {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === 'object') {
					const candidate = parsed as { data?: unknown[]; updated?: unknown };
					if (Array.isArray(candidate.data)) {
						entries = candidate.data.length;
					}
					if (typeof candidate.updated === 'number') {
						updated = candidate.updated;
					}
				}
			} catch {
				entries = 0;
			}

			stats.push({
				id: key,
				key,
				entries,
				bytes: new Blob([raw]).size,
				updated
			});
		}

		return stats;
	}

	async function getServiceWorkerCacheStats(): Promise<ServiceWorkerCacheStat[]> {
		if (typeof window === 'undefined' || !('caches' in window)) return [];

		const names = await caches.keys();
		const relevant = names.filter((name) => name.startsWith('krawlet-'));

		return Promise.all(
			relevant.map(async (name) => {
				const cache = await caches.open(name);
				const keys = await cache.keys();
				return {
					id: name,
					name,
					entries: keys.length
				};
			})
		);
	}

	function withConfirm(message: string, action: () => Promise<void>) {
		confirm.confirm({
			message,
			danger: true,
			confirmButtonLabel: t('common.confirm'),
			cancelButtonLabel: t('common.cancel'),
			confirm: () => {
				void action();
			}
		});
	}

	async function runAction(id: string, fn: () => Promise<void>) {
		actionId = id;
		try {
			await fn();
			await loadCacheStats();
		} catch (err) {
			console.error('Cache action failed:', err);
			notifications.error(t('settings.cacheActionFailed'));
		} finally {
			actionId = null;
		}
	}

	function clearIndexedDbStore(storeName: string) {
		withConfirm(t('settings.cacheConfirmStore', { store: storeName }), async () => {
			await runAction(`clear-idb-${storeName}`, async () => {
				const db = await getDB();
				await db.clear(storeName);
				notifications.success(t('settings.cacheStoreCleared', { store: storeName }));
			});
		});
	}

	function clearAllIndexedDb() {
		withConfirm(t('settings.cacheConfirmIdbAll'), async () => {
			await runAction('clear-idb-all', async () => {
				const db = await getDB();
				await Promise.all(indexedDbStores.map((store) => db.clear(store.name)));
				notifications.success(t('settings.cacheIdbCleared'));
			});
		});
	}

	function clearLocalCache(key: string) {
		withConfirm(t('settings.cacheConfirmLocalKey', { key }), async () => {
			await runAction(`clear-local-${key}`, async () => {
				localStorage.removeItem(key);
				notifications.success(t('settings.cacheLocalCleared', { key }));
			});
		});
	}

	function clearAllLocalCaches() {
		withConfirm(t('settings.cacheConfirmLocalAll'), async () => {
			await runAction('clear-local-all', async () => {
				LOCAL_STORAGE_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
				notifications.success(t('settings.cacheLocalAllCleared'));
			});
		});
	}

	function clearServiceWorkerCache(cacheName: string) {
		withConfirm(t('settings.cacheConfirmSwKey', { cache: cacheName }), async () => {
			await runAction(`clear-sw-${cacheName}`, async () => {
				await caches.delete(cacheName);
				notifications.success(t('settings.cacheSwCleared', { cache: cacheName }));
			});
		});
	}

	function clearAllServiceWorkerCaches() {
		withConfirm(t('settings.cacheConfirmSwAll'), async () => {
			await runAction('clear-sw-all', async () => {
				const names = await caches.keys();
				const relevant = names.filter((name) => name.startsWith('krawlet-'));
				await Promise.all(relevant.map((name) => caches.delete(name)));
				notifications.success(t('settings.cacheSwAllCleared'));
			});
		});
	}

	function clearEverything() {
		withConfirm(t('settings.cacheConfirmEverything'), async () => {
			await runAction('clear-everything', async () => {
				const db = await getDB();
				await Promise.all(indexedDbStores.map((store) => db.clear(store.name)));
				LOCAL_STORAGE_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
				const names = await caches.keys();
				const relevant = names.filter((name) => name.startsWith('krawlet-'));
				await Promise.all(relevant.map((name) => caches.delete(name)));
				notifications.success(t('settings.cacheEverythingCleared'));
			});
		});
	}

	onMount(() => {
		void loadCacheStats();
	});
</script>

<Section lgCols={12} mdCols={12} smCols={12}>
	<h2><FontAwesomeIcon icon={faBoxArchive} /> {$t$('settings.tabs.cache')}</h2>

	<div class="cache-layout">
		<div class="cache-summary">
			<div class="summary-copy">
				<p class="summary-title">{$t$('settings.cacheTitle')}</p>
				<p class="summary-subtitle">{$t$('settings.cacheSubtitle')}</p>
			</div>
			<div class="summary-actions">
				<div class="summary-stats">
					<span>{totalEntries.toLocaleString()} {$t$('settings.cacheEntries')}</span>
					<span>{bytesToHuman(totalBytes)}</span>
					<span
						>{indexedDbSummary.stores + localStorageSummary.stores + serviceWorkerSummary.stores}
						{$t$('settings.cacheBuckets')}</span
					>
				</div>
				<Button
					variant="secondary"
					size="small"
					onClick={() => loadCacheStats()}
					disabled={loading || actionId !== null}
				>
					<FontAwesomeIcon icon={faArrowsRotate} />
					{$t$('settings.cacheRefresh')}
				</Button>
			</div>
		</div>

		<div class="health-note {cacheHealth.level}">
			{cacheHealth.message}
		</div>

		<div class="cache-sections">
			<SettingsFieldset>
				{#snippet legend()}
					<FontAwesomeIcon icon={faDatabase} /> {$t$('settings.cacheIndexedDb')}
				{/snippet}
				<div class="actions-row">
					<Button
						variant="secondary"
						size="small"
						onClick={clearAllIndexedDb}
						disabled={loading || actionId !== null}
						loading={actionId === 'clear-idb-all'}
					>
						<FontAwesomeIcon icon={faTrashCan} />
						{$t$('settings.cacheClearAll')}
					</Button>
				</div>

				{#if indexedDbStores.length === 0}
					<p class="empty">{$t$('settings.cacheNoneForCategory')}</p>
				{:else}
					<div class="table-grid">
						{#each indexedDbStores as store (store.id)}
							<div class="table-row">
								<div class="row-main">
									<div class="row-title">{store.name}</div>
									<div class="row-meta">
										<span>{store.entries.toLocaleString()} {$t$('settings.cacheEntries')}</span>
										<span>{bytesToHuman(store.bytes)}</span>
									</div>
								</div>
								<Button
									variant="secondary"
									size="small"
									onClick={() => clearIndexedDbStore(store.name)}
									disabled={loading || actionId !== null}
									loading={actionId === `clear-idb-${store.name}`}
								>
									<FontAwesomeIcon icon={faTrash} />
									{$t$('settings.cacheClear')}
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</SettingsFieldset>

			<SettingsFieldset>
				{#snippet legend()}
					<FontAwesomeIcon icon={faHardDrive} /> {$t$('settings.cacheLocalStorage')}
				{/snippet}
				<div class="actions-row">
					<Button
						variant="secondary"
						size="small"
						onClick={clearAllLocalCaches}
						disabled={loading || actionId !== null}
						loading={actionId === 'clear-local-all'}
					>
						<FontAwesomeIcon icon={faTrashCan} />
						{$t$('settings.cacheClearAll')}
					</Button>
				</div>

				{#if localStorageCaches.length === 0}
					<p class="empty">{$t$('settings.cacheNoneForCategory')}</p>
				{:else}
					<div class="table-grid">
						{#each localStorageCaches as cache (cache.id)}
							<div class="table-row">
								<div class="row-main">
									<div class="row-title">{cache.key}</div>
									<div class="row-meta">
										<span>{cache.entries.toLocaleString()} {$t$('settings.cacheEntries')}</span>
										<span>{bytesToHuman(cache.bytes)}</span>
										<span>{$t$('settings.cacheUpdated')}: {formatUpdatedAt(cache.updated)}</span>
									</div>
								</div>
								<Button
									variant="secondary"
									size="small"
									onClick={() => clearLocalCache(cache.key)}
									disabled={loading || actionId !== null}
									loading={actionId === `clear-local-${cache.key}`}
								>
									<FontAwesomeIcon icon={faTrash} />
									{$t$('settings.cacheClear')}
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</SettingsFieldset>

			<SettingsFieldset>
				{#snippet legend()}
					<FontAwesomeIcon icon={faBolt} /> {$t$('settings.cacheServiceWorker')}
				{/snippet}
				<div class="actions-row">
					<Button
						variant="secondary"
						size="small"
						onClick={clearAllServiceWorkerCaches}
						disabled={loading || actionId !== null}
						loading={actionId === 'clear-sw-all'}
					>
						<FontAwesomeIcon icon={faTrashCan} />
						{$t$('settings.cacheClearAll')}
					</Button>
				</div>

				{#if serviceWorkerCaches.length === 0}
					<p class="empty">{$t$('settings.cacheNoneForCategory')}</p>
				{:else}
					<div class="table-grid">
						{#each serviceWorkerCaches as cache (cache.id)}
							<div class="table-row">
								<div class="row-main">
									<div class="row-title">{cache.name}</div>
									<div class="row-meta">
										<span>{cache.entries.toLocaleString()} {$t$('settings.cacheEntries')}</span>
									</div>
								</div>
								<Button
									variant="secondary"
									size="small"
									onClick={() => clearServiceWorkerCache(cache.name)}
									disabled={loading || actionId !== null}
									loading={actionId === `clear-sw-${cache.name}`}
								>
									<FontAwesomeIcon icon={faTrash} />
									{$t$('settings.cacheClear')}
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</SettingsFieldset>
		</div>

		<div class="danger-zone">
			<div>
				<h4>{$t$('settings.cacheDangerZone')}</h4>
				<p>{$t$('settings.cacheDangerZoneHint')}</p>
			</div>
			<Button
				variant="error"
				onClick={clearEverything}
				disabled={loading || actionId !== null}
				loading={actionId === 'clear-everything'}
			>
				<FontAwesomeIcon icon={faTrashCan} />
				{$t$('settings.cacheClearEverything')}
			</Button>
		</div>
	</div>
</Section>

<style>
	.cache-layout {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.cache-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.summary-copy {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.summary-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.summary-subtitle {
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.75;
	}

	.summary-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.summary-stats {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.45rem;
	}

	.summary-stats span {
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		font-size: 0.8rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.16);
	}

	.health-note {
		padding: 0.45rem 0.65rem;
		border-radius: 0.4rem;
		font-size: 0.88rem;
		font-weight: 500;
	}

	.health-note.good {
		color: rgb(var(--green));
		background-color: rgba(var(--green), 0.12);
	}

	.health-note.warn {
		color: rgb(255, 196, 96);
		background-color: rgba(255, 185, 72, 0.12);
	}

	.cache-sections {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.actions-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.75rem;
	}

	.table-grid {
		display: grid;
		gap: 0.6rem;
	}

	.table-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.6rem 0.7rem;
		border-radius: 0.6rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.02);
	}

	.row-main {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.row-title {
		font-family: var(--font-family);
		font-weight: 600;
	}

	.row-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem 0.8rem;
		font-size: 0.85rem;
		opacity: 0.78;
	}

	.empty {
		margin: 0;
		opacity: 0.75;
	}

	.danger-zone {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		padding: 0.75rem;
		border: 1px solid rgba(var(--red), 0.35);
		border-radius: 0.5rem;
		background: linear-gradient(160deg, rgba(var(--red), 0.12), rgba(0, 0, 0, 0.05));
	}

	.danger-zone h4 {
		margin: 0 0 0.25rem;
	}

	.danger-zone p {
		margin: 0;
		opacity: 0.8;
	}

	@media (max-width: 900px) {
		.cache-summary {
			flex-direction: column;
			align-items: flex-start;
		}

		.summary-actions {
			width: 100%;
			justify-content: space-between;
		}

		.summary-stats {
			justify-content: flex-start;
		}

		.danger-zone {
			flex-direction: column;
			align-items: flex-start;
		}

		.table-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.actions-row {
			justify-content: flex-start;
		}
	}
</style>
