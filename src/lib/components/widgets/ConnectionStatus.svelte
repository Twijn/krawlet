<!--
  @component ConnectionStatus

  A small indicator showing WebSocket connection status.
  Displays in the header to show real-time update connection state.

  @example
  <ConnectionStatus />
-->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faWifi,
		faWifi3,
		faTriangleExclamation,
		type IconDefinition
	} from '@fortawesome/free-solid-svg-icons';
	import { websocket } from '$lib/stores/websocket';
	import { t$ } from '$lib/i18n';

	const stateColors: Record<string, string> = {
		connected: 'rgb(var(--green))',
		connecting: 'rgb(var(--blue))',
		disconnected: 'var(--text-color-2)',
		error: 'rgb(var(--red))'
	};

	const stateIcons: Record<string, IconDefinition> = {
		connected: faWifi,
		connecting: faWifi3,
		disconnected: faWifi3,
		error: faTriangleExclamation
	};

	const stateLabels: Record<string, string> = {
		connected: 'websocket.connected',
		connecting: 'websocket.connecting',
		disconnected: 'websocket.disconnected',
		error: 'websocket.error'
	};

	// Subscribe to the state store for reactive updates
	const wsState = websocket.state;
	let connectionState = $derived($wsState);
	let color = $derived(stateColors[connectionState] || stateColors.disconnected);
	let icon = $derived(stateIcons[connectionState] || stateIcons.disconnected);
	let label = $derived($t$(stateLabels[connectionState] || stateLabels.disconnected));

	let showTooltip = $state(false);
</script>

<div
	class="connection-status"
	class:disconnected={connectionState === 'disconnected'}
	role="status"
	aria-live="polite"
	aria-label={label}
	onmouseenter={() => (showTooltip = true)}
	onmouseleave={() => (showTooltip = false)}
	onfocus={() => (showTooltip = true)}
	onblur={() => (showTooltip = false)}
>
	<span class="icon" style:color={color}>
		<FontAwesomeIcon {icon} size="1x" />
	</span>
	{#if showTooltip}
		<span class="tooltip" style:border-color={color} transition:fly={{ x: 4, duration: 150 }}>{label}</span>
	{/if}
</div>

<style>
	.connection-status {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.6rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-color-2);
		cursor: default;
		transition: color 0.2s;
	}

	.connection-status:hover {
		color: var(--text-color-1);
	}

	.icon {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	/* Slash-through effect for disconnected state */
	.connection-status.disconnected .icon::after {
		content: '';
		position: absolute;
		width: 120%;
		height: 2px;
		background: var(--text-color-2);
		transform: rotate(-45deg);
		border-radius: 1px;
	}

	.tooltip {
		position: absolute;
		top: 50%;
		right: 125%;
		transform: translateY(-50%);
		padding: 0.4rem 0.6rem;
		background: var(--background-color-2);
		border: 1px solid;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-color-1);
		white-space: nowrap;
		z-index: 1000;
		pointer-events: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
	}
</style>
