<!--
  @component ApiStatus

  A footer indicator showing the overall Krawlet API service status.
  Shows individual service statuses in a drop-up menu on hover/focus.

  @example
  <ApiStatus />
-->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faCircleCheck,
		faCircleExclamation,
		faCircleXmark,
		faSpinner,
		type IconDefinition
	} from '@fortawesome/free-solid-svg-icons';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { ServiceStatus, ServiceName } from 'krawlet-js';
	import krawlet from '$lib/api/krawlet';
	import { t$ } from '$lib/i18n';

	const stateColors: Record<ServiceStatus, string> = {
		connected: 'rgb(var(--green))',
		connecting: 'rgb(var(--blue))',
		disconnected: 'var(--text-color-2)',
		error: 'rgb(var(--red))'
	};

	const stateIcons: Record<ServiceStatus, IconDefinition> = {
		connected: faCircleCheck,
		connecting: faSpinner,
		disconnected: faCircleXmark,
		error: faCircleExclamation
	};

	const serviceNames: Record<ServiceName, string> = {
		kromerWs: 'apiStatus.services.kromerWs',
		chatbox: 'apiStatus.services.chatbox',
		discord: 'apiStatus.services.discord'
	};

	const serviceOrder: ServiceName[] = ['kromerWs', 'chatbox', 'discord'];

	let servicesStatus = $state<Record<ServiceName, ServiceStatus>>({
		kromerWs: 'connecting',
		chatbox: 'connecting',
		discord: 'connecting'
	});

	let showDropup = $state(false);
	let fetchError = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let lastFetchTime = 0;
	const POLL_INTERVAL = 120000; // 2 minutes

	// Check if page is visible
	function isPageVisible(): boolean {
		return document.visibilityState === 'visible';
	}

	// Calculate overall status
	let overallStatus = $derived.by(() => {
		const statuses = Object.values(servicesStatus);
		if (statuses.some((s) => s === 'error')) return 'error' as ServiceStatus;
		if (statuses.some((s) => s === 'disconnected')) return 'disconnected' as ServiceStatus;
		if (statuses.some((s) => s === 'connecting')) return 'connecting' as ServiceStatus;
		return 'connected' as ServiceStatus;
	});

	let overallColor = $derived(stateColors[overallStatus]);
	let overallIcon = $derived(stateIcons[overallStatus]);

	let overallLabel = $derived.by(() => {
		if (fetchError) return $t$('apiStatus.fetchError');
		switch (overallStatus) {
			case 'connected':
				return $t$('apiStatus.allConnected');
			case 'connecting':
				return $t$('apiStatus.connecting');
			case 'disconnected':
				return $t$('apiStatus.someDisconnected');
			case 'error':
				return $t$('apiStatus.error');
			default:
				return $t$('apiStatus.unknown');
		}
	});

	// Check if Kromer API might be down (kromerWs is connecting)
	let kromerApiWarning = $derived(servicesStatus.kromerWs === 'connecting' && !fetchError);

	async function fetchServiceStatus() {
		try {
			const status = await krawlet.health.getServicesStatus();
			servicesStatus = status;
			fetchError = false;
			lastFetchTime = Date.now();
		} catch {
			fetchError = true;
			// Set all to error state on fetch failure
			servicesStatus = {
				kromerWs: 'error',
				chatbox: 'error',
				discord: 'error'
			};
		}
	}

	// Handle visibility change - fetch if data is stale when page becomes visible
	function handleVisibilityChange() {
		if (isPageVisible() && Date.now() - lastFetchTime >= POLL_INTERVAL) {
			fetchServiceStatus();
		}
	}

	onMount(() => {
		if (browser) {
			fetchServiceStatus();
			// Poll every 2 minutes, but only if page is visible
			pollInterval = setInterval(() => {
				if (isPageVisible()) {
					fetchServiceStatus();
				}
			}, POLL_INTERVAL);

			document.addEventListener('visibilitychange', handleVisibilityChange);
		}
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
		if (browser) {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}
	});
</script>

<div
	class="api-status"
	role="status"
	aria-live="polite"
	aria-label={overallLabel}
	onmouseenter={() => (showDropup = true)}
	onmouseleave={() => (showDropup = false)}
	onfocus={() => (showDropup = true)}
	onblur={() => (showDropup = false)}
>
	<button class="status-button" aria-expanded={showDropup} aria-haspopup="true">
		<span class="icon" class:spin={overallStatus === 'connecting'} style:color={overallColor}>
			<FontAwesomeIcon icon={overallIcon} size="sm" />
		</span>
		<span class="label">{$t$('apiStatus.title')}</span>
	</button>

	{#if showDropup}
		<div
			class="dropup"
			style:border-color={overallColor}
			transition:fly={{ y: 8, duration: 150 }}
			role="menu"
		>
			<div class="dropup-header">
				<span class="icon" class:spin={overallStatus === 'connecting'} style:color={overallColor}>
					<FontAwesomeIcon icon={overallIcon} size="sm" />
				</span>
				<span>{overallLabel}</span>
			</div>

			{#if kromerApiWarning}
				<div class="kromer-warning">
					<FontAwesomeIcon icon={faCircleExclamation} size="sm" />
					<span>{$t$('apiStatus.kromerApiWarning')}</span>
				</div>
			{/if}

			<ul class="services-list">
				{#each serviceOrder as service (service)}
					{@const status = servicesStatus[service]}
					{@const color = stateColors[status]}
					{@const icon = stateIcons[status]}
					<li class="service-item" role="menuitem">
						<span class="service-icon" class:spin={status === 'connecting'} style:color>
							<FontAwesomeIcon {icon} size="sm" />
						</span>
						<span class="service-name">{$t$(serviceNames[service])}</span>
						<span class="service-status" style:color>{$t$(`apiStatus.status.${status}`)}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.api-status {
		position: relative;
		display: inline-flex;
	}

	.status-button {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-color-2);
		cursor: pointer;
		transition:
			color 0.2s,
			background 0.2s;
	}

	.status-button:hover,
	.status-button:focus-visible {
		color: var(--text-color-1);
		background: var(--background-color-2);
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	.icon.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.label {
		white-space: nowrap;
	}

	.dropup {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 0.5rem;
		padding: 0.75rem;
		background: rgba(12, 29, 39, 0.5);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		min-width: 220px;
		z-index: 1000;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	@media only screen and (min-width: 601px) {
		.dropup {
			left: auto;
			right: 0;
			transform: none;
		}
	}

	.dropup-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-color);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-color-1);
	}

	.kromer-warning {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.5rem;
		margin-bottom: 0.5rem;
		background: rgba(var(--yellow), 0.15);
		border-radius: 0.25rem;
		font-size: 0.7rem;
		color: rgb(var(--yellow));
	}

	.services-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.service-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0;
		font-size: 0.75rem;
	}

	.service-item:not(:last-child) {
		border-bottom: 1px solid var(--border-color);
	}

	.service-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.service-icon.spin {
		animation: spin 1s linear infinite;
	}

	.service-name {
		flex: 1;
		color: var(--text-color-1);
	}

	.service-status {
		font-size: 0.7rem;
		text-transform: capitalize;
	}
</style>
