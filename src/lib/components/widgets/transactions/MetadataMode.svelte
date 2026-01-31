<script lang="ts">
	import playerWalletStore, { type Player } from '$lib/stores/playerWallets';
	import { onDestroy, onMount } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	import { cubicOut, cubicInOut } from 'svelte/easing';
	import { t$ } from '$lib/i18n';
	import { faUser, faMessage, faCode, faCheck } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	type MetadataMode = 'player' | 'message' | 'raw';
	type MessageType = 'message' | 'error';

	let {
		metadata = $bindable(''),
		lock = $bindable(false),
		fromAddress = ''
	}: {
		metadata: string;
		lock?: boolean;
		fromAddress?: string;
	} = $props();

	// Find if the from address has an associated player
	let fromPlayer: Player | null = $derived(
		$playerWalletStore.data.find((p) => p.kromerAddress === fromAddress) ?? null
	);

	// Check if there are any players available
	let hasPlayers = $derived($playerWalletStore.data.length > 0);

	// Default to player mode if from address has a player, otherwise raw
	let mode: MetadataMode = $state('raw');
	let hasInitialized: boolean = $state(false);

	// Initialize mode based on fromAddress - only once on mount or when fromPlayer changes
	$effect(() => {
		if (fromPlayer && !hasInitialized) {
			mode = 'player';
			hasInitialized = true;
		}
	});

	// Player mode state
	let showPlayerPicker: boolean = $state(false);
	let playerFilter: string = $state('');
	let selectedPlayerUUID: string = $state('');
	let playerExtraData: string = $state('');

	// Set default selected player to the from address's player if available
	$effect(() => {
		if (fromPlayer && !selectedPlayerUUID) {
			selectedPlayerUUID = fromPlayer.minecraftUUID;
		}
	});

	let filteredPlayers: Player[] = $derived(
		$playerWalletStore.data.filter((x) =>
			x.minecraftName.toLowerCase().includes(playerFilter.toLowerCase())
		) ?? []
	);

	let selectedPlayer: Player | null = $derived(
		$playerWalletStore.data.find((x) => x.minecraftUUID === selectedPlayerUUID) ?? null
	);

	// Message mode state
	let messageType: MessageType = $state('message');
	let messageContent: string = $state('');

	// Raw mode state
	let rawMetadata: string = $state('');

	// Update metadata based on current mode
	$effect(() => {
		if (lock) return;

		if (mode === 'player' && selectedPlayer) {
			let base = `useruuid=${selectedPlayer.minecraftUUID};return=${selectedPlayer.kromerAddress};username=${selectedPlayer.minecraftName}`;
			if (playerExtraData.trim()) {
				metadata = `${base};${playerExtraData.trim()}`;
			} else {
				metadata = base;
			}
		} else if (mode === 'message' && messageContent) {
			metadata = `${messageType}=${messageContent}`;
		} else if (mode === 'raw') {
			metadata = rawMetadata;
		} else {
			metadata = '';
		}
	});

	// Sync rawMetadata when mode changes to raw or when metadata is set externally
	$effect(() => {
		if (mode === 'raw' && metadata !== rawMetadata && !lock) {
			rawMetadata = metadata;
		}
	});

	function selectPlayer(player: Player) {
		selectedPlayerUUID = player.minecraftUUID;
		showPlayerPicker = false;
		playerFilter = '';
	}

	onDestroy(playerWalletStore.destroy);
</script>

<div class="metadata-mode">
	{#if !lock}
		<div class="mode-tabs">
			{#if hasPlayers}
				<button
					type="button"
					class="mode-tab"
					class:active={mode === 'player'}
					onclick={() => (mode = 'player')}
				>
					<FontAwesomeIcon icon={faUser} />
					<span>Player</span>
				</button>
			{/if}
			<button
				type="button"
				class="mode-tab"
				class:active={mode === 'message'}
				onclick={() => (mode = 'message')}
			>
				<FontAwesomeIcon icon={faMessage} />
				<span>Message</span>
			</button>
			<button
				type="button"
				class="mode-tab"
				class:active={mode === 'raw'}
				onclick={() => (mode = 'raw')}
			>
				<FontAwesomeIcon icon={faCode} />
				<span>Raw</span>
			</button>
		</div>
	{/if}

	<div class="mode-content">
		{#if mode === 'player'}
			<div class="player-mode" in:fade={{ duration: 150, easing: cubicOut }} out:fade={{ duration: 100 }}>
				{#if selectedPlayer && !showPlayerPicker}
					<div class="selected-player" in:slide={{ duration: 200, easing: cubicOut }} out:slide={{ duration: 150 }}>
						<div class="player-info">
							<span class="player-name">{selectedPlayer.minecraftName}</span>
							{#if selectedPlayer.online}
								<span class="online-badge">Online</span>
							{/if}
						</div>
						{#if !lock}
							<button type="button" class="change-btn" onclick={() => (showPlayerPicker = true)}>
								Change
							</button>
						{/if}
					</div>
				{:else}
					<div class="player-picker" in:slide={{ duration: 200, easing: cubicOut }} out:slide={{ duration: 150 }}>
						<input
							type="text"
							bind:value={playerFilter}
							placeholder={$t$('transaction.metadataModes.filterPlayers')}
							disabled={lock}
						/>
						<div class="player-list">
							{#each filteredPlayers.slice(0, 8) as player, i (player.minecraftUUID)}
								<button
									type="button"
									class="player-option"
									class:selected={player.minecraftUUID === selectedPlayerUUID}
									onclick={() => selectPlayer(player)}
									in:slide={{ duration: 150, delay: i * 30, easing: cubicOut }}
								>
									<span class="player-name">{player.minecraftName}</span>
									{#if player.online}
										<span class="online-badge">Online</span>
									{/if}
									{#if player.minecraftUUID === selectedPlayerUUID}
										<FontAwesomeIcon icon={faCheck} />
									{/if}
								</button>
							{/each}
							{#if filteredPlayers.length === 0}
								<div class="no-results" in:fade={{ duration: 150 }}>{$t$('transaction.metadataModes.noPlayersFound')}</div>
							{/if}
						</div>
						{#if selectedPlayer}
							<button type="button" class="done-btn" onclick={() => (showPlayerPicker = false)} in:slide={{ duration: 150, easing: cubicOut }}>
								Done
							</button>
						{/if}
					</div>
				{/if}

				{#if selectedPlayer && !showPlayerPicker}
					<div class="extra-data" in:slide={{ duration: 200, delay: 100, easing: cubicOut }} out:slide={{ duration: 150 }}>
						<label for="player-extra-data">Additional data (optional)</label>
						<input
							type="text"
							id="player-extra-data"
							bind:value={playerExtraData}
							placeholder="key=value;another=value"
							disabled={lock}
						/>
					</div>
				{/if}
			</div>
		{:else if mode === 'message'}
			<div class="message-mode" in:fade={{ duration: 150, easing: cubicOut }} out:fade={{ duration: 100 }}>
				<div class="message-type-toggle">
					<button
						type="button"
						class="type-btn"
						class:active={messageType === 'message'}
						onclick={() => (messageType = 'message')}
					>
						Message
					</button>
					<button
						type="button"
						class="type-btn error"
						class:active={messageType === 'error'}
						onclick={() => (messageType = 'error')}
					>
						Error
					</button>
				</div>
				<input
					type="text"
					bind:value={messageContent}
					placeholder={messageType === 'message'
						? $t$('transaction.metadataModes.messagePlaceholder')
						: $t$('transaction.metadataModes.errorPlaceholder')}
					disabled={lock}
				/>
			</div>
		{:else if mode === 'raw'}
			<div class="raw-mode" in:fade={{ duration: 150, easing: cubicOut }} out:fade={{ duration: 100 }}>
				<textarea
					bind:value={rawMetadata}
					placeholder="key=value;anotherkey=anothervalue"
					disabled={lock}
					rows="2"
				></textarea>
			</div>
		{/if}
	</div>

	{#if metadata && mode !== 'raw'}
		<details class="metadata-preview" in:slide={{ duration: 150, easing: cubicOut }}>
			<summary>Preview metadata</summary>
			<code>{metadata}</code>
		</details>
	{/if}
</div>

<style>
	.metadata-mode {
		margin: 0.75em 0;
	}

	.mode-tabs {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}

	.mode-tab {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid transparent;
		border-radius: 0.375rem;
		color: var(--text-color-2);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.mode-tab:hover {
		background: rgba(0, 0, 0, 0.3);
		color: var(--text-color-1);
		transform: translateY(-1px);
	}

	.mode-tab:active {
		transform: translateY(0);
	}

	.mode-tab.active {
		background: rgba(var(--theme-color-rgb), 0.15);
		border-color: rgba(var(--theme-color-rgb), 0.3);
		color: rgb(var(--theme-color-rgb));
		box-shadow: 0 0 12px rgba(var(--theme-color-rgb), 0.2);
	}

	.mode-tab span {
		display: none;
	}

	@media (min-width: 400px) {
		.mode-tab span {
			display: inline;
		}
	}

	/* Player mode */
	.player-mode {
		overflow: hidden;
	}

	.selected-player {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 0.75rem;
		background: rgba(var(--green), 0.1);
		border: 1px solid rgba(var(--green), 0.2);
		border-radius: 0.5rem;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.selected-player:hover {
		background: rgba(var(--green), 0.15);
		border-color: rgba(var(--green), 0.3);
	}

	.player-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.player-name {
		font-weight: 500;
		color: var(--text-color-1);
	}

	.online-badge {
		font-size: 0.7rem;
		padding: 0.15rem 0.4rem;
		background: rgba(var(--green), 0.2);
		color: rgb(var(--green));
		border-radius: 0.25rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.change-btn {
		padding: 0.3rem 0.6rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.375rem;
		color: var(--text-color-2);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.change-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.3);
		color: var(--text-color-1);
		transform: scale(1.02);
	}

	.change-btn:active {
		transform: scale(0.98);
	}

	.player-picker {
		overflow: hidden;
	}

	.player-picker input {
		margin-bottom: 0.5rem;
	}

	.player-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 200px;
		overflow-y: auto;
		margin-bottom: 0.5rem;
	}

	.player-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid transparent;
		border-radius: 0.375rem;
		color: var(--text-color-1);
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		text-align: left;
	}

	.player-option:hover {
		background: rgba(0, 0, 0, 0.35);
		transform: translateX(4px);
	}

	.player-option.selected {
		background: rgba(var(--theme-color-rgb), 0.15);
		border-color: rgba(var(--theme-color-rgb), 0.3);
		box-shadow: 0 0 8px rgba(var(--theme-color-rgb), 0.15);
	}

	.player-option .player-name {
		flex: 1;
	}

	.no-results {
		padding: 0.75rem;
		text-align: center;
		color: var(--text-color-2);
		font-size: 0.875rem;
	}

	.done-btn {
		width: 100%;
		padding: 0.5rem;
		background: rgba(var(--theme-color-rgb), 0.2);
		border: none;
		border-radius: 0.375rem;
		color: rgb(var(--theme-color-rgb));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.done-btn:hover {
		background: rgba(var(--theme-color-rgb), 0.35);
		box-shadow: 0 2px 8px rgba(var(--theme-color-rgb), 0.25);
		transform: translateY(-1px);
	}

	.done-btn:active {
		transform: translateY(0);
	}

	/* Extra data input */
	.extra-data {
		margin-top: 0.75rem;
	}

	.extra-data label {
		display: block;
		font-size: 0.8125rem;
		color: var(--text-color-2);
		margin-bottom: 0.25rem;
	}

	.extra-data input {
		font-family: monospace;
		font-size: 0.875rem;
	}

	/* Message mode */
	.message-type-toggle {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.type-btn {
		flex: 1;
		padding: 0.4rem 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid transparent;
		border-radius: 0.375rem;
		color: var(--text-color-2);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.type-btn:hover {
		background: rgba(0, 0, 0, 0.3);
		color: var(--text-color-1);
		transform: translateY(-1px);
	}

	.type-btn:active {
		transform: translateY(0);
	}

	.type-btn.active {
		background: rgba(var(--blue), 0.15);
		border-color: rgba(var(--blue), 0.3);
		color: rgb(var(--blue));
		box-shadow: 0 0 10px rgba(var(--blue), 0.2);
	}

	.type-btn.error.active {
		background: rgba(var(--red), 0.15);
		border-color: rgba(var(--red), 0.3);
		color: rgb(var(--red));
		box-shadow: 0 0 10px rgba(var(--red), 0.2);
	}

	/* Raw mode */
	.raw-mode textarea {
		min-height: 60px;
		font-family: monospace;
		font-size: 0.875rem;
	}

	/* Preview */
	.metadata-preview {
		margin-top: 0.5rem;
	}

	.metadata-preview summary {
		font-size: 0.75rem;
		color: var(--text-color-2);
		cursor: pointer;
		user-select: none;
	}

	.metadata-preview summary:hover {
		color: var(--text-color-1);
	}

	.metadata-preview code {
		display: block;
		margin-top: 0.375rem;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		word-break: break-all;
		color: var(--text-color-2);
	}
</style>
