<!--
  @component ConnectionStatus

  A small indicator showing WebSocket connection status.
  Displays in the header to show real-time update connection state.

  @example
  <ConnectionStatus />
-->
<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faWifi } from '@fortawesome/free-solid-svg-icons';
	import { websocket } from '$lib/stores/websocket';
	import { t$ } from '$lib/i18n';

	const stateColors: Record<string, string> = {
		connected: 'var(--green)',
		connecting: 'var(--blue)',
		disconnected: 'var(--text-color-2)',
		error: 'var(--red)'
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
	let label = $derived($t$(stateLabels[connectionState] || stateLabels.disconnected));

	let showTooltip = $state(false);
</script>

<div
	class="connection-status"
	role="status"
	aria-live="polite"
	aria-label={label}
	onmouseenter={() => (showTooltip = true)}
	onmouseleave={() => (showTooltip = false)}
	onfocus={() => (showTooltip = true)}
	onblur={() => (showTooltip = false)}
>
	<span class="indicator" style="background: {color}"></span>
	<FontAwesomeIcon icon={faWifi} size="sm" />
	{#if showTooltip}
		<span class="tooltip">{label}</span>
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

	.indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		transition: background 0.2s;
	}

	.tooltip {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 0.5rem;
		padding: 0.4rem 0.6rem;
		background: var(--background-color-3);
		border: 1px solid var(--border-color);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		white-space: nowrap;
		z-index: 1000;
		pointer-events: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
</style>
