<script lang="ts">
	import playerWalletStore, { type Player } from '$lib/stores/playerWallets';
	import knownAddressStore, { type KnownAddress } from '$lib/stores/knownAddresses';
	import { onDestroy, onMount } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	import { cubicOut, cubicInOut } from 'svelte/easing';
	import { t$ } from '$lib/i18n';
	import { faUser, faMessage, faCode, faCheck, faBolt, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import krawlet from '$lib/api/krawlet';

	type MetadataMode = 'player' | 'message' | 'actions' | 'refund' | 'raw';
	type MessageType = 'message' | 'error';

	// Action configuration with fee information
	// fee: number - the cost to perform this action (same as overrideAmount)
	// refundsAmount: boolean - if true, the action refunds the full transaction amount (fee = 0)
	export type ActionConfig = {
		id: string;
		labelKey: string;
		fee: number;
		refundsAmount: boolean;
		targetAddress: string;
		danger?: boolean;
		beforeSend?: () => Promise<{ success: boolean; error?: string }>;
	};

	// Define available actions with their fees
	const ACTIONS: ActionConfig[] = [
		{
			id: 'set_shop_info',
			labelKey: 'transaction.metadataModes.setShopInfo',
			fee: 0.01,
			refundsAmount: false,
			targetAddress: 'kkrawletii',
			beforeSend: async () => {
				try {
					const isHealthy = await krawlet.healthCheck();
					if (!isHealthy) {
						return { success: false, error: 'Krawlet API is currently unavailable. Please try again later.' };
					}
					return { success: true };
				} catch {
					return { success: false, error: 'Failed to reach Krawlet API. Please check your connection.' };
				}
			}
		},
		{
			id: 'delete_shop_info',
			labelKey: 'transaction.metadataModes.deleteShopInfo',
			fee: 0.01,
			refundsAmount: false,
			targetAddress: 'kkrawletii',
			danger: true,
			beforeSend: async () => {
				try {
					const isHealthy = await krawlet.healthCheck();
					if (!isHealthy) {
						return { success: false, error: 'Krawlet API is currently unavailable. Please try again later.' };
					}
					return { success: true };
				} catch {
					return { success: false, error: 'Failed to reach Krawlet API. Please check your connection.' };
				}
			}
		}
	];

	let {
		metadata = $bindable(''),
		lock = $bindable(false),
		fromAddress = '',
		overrideAddress = $bindable(''),
		overrideAmount = $bindable(0),
		fieldsLocked = $bindable(false),
		beforeSend = $bindable<(() => Promise<{ success: boolean; error?: string }>) | null>(null)
	}: {
		metadata: string;
		lock?: boolean;
		fromAddress?: string;
		overrideAddress?: string;
		overrideAmount?: number;
		fieldsLocked?: boolean;
		beforeSend?: (() => Promise<{ success: boolean; error?: string }>) | null;
	} = $props();

	// Find if the from address has an associated player
	let fromPlayer: Player | null = $derived(
		$playerWalletStore.data.find((p) => p.kromerAddress === fromAddress) ?? null
	);

	// Find if the from address has known address info (for shop deletion)
	let fromKnownAddress: KnownAddress | null = $derived(
		$knownAddressStore.data.find((a) => a.address === fromAddress) ?? null
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

	// Refund mode state
	let refundTxId: string = $state('');
	let refundOriginalAmount: string = $state('');
	let refundMessage: string = $state('');

	// Actions mode state
	let selectedActionId: string = $state('set_shop_info');
	let selectedAction = $derived(ACTIONS.find(a => a.id === selectedActionId) ?? ACTIONS[0]);
	let shopName: string = $state('');
	let shopDescription: string = $state('');
	let shopInfoInitialized: boolean = $state(false);

	// Auto-fill shop info from known address when entering actions mode or when fromKnownAddress changes
	$effect(() => {
		if (mode === 'actions' && selectedAction.id === 'set_shop_info' && fromKnownAddress && !shopInfoInitialized) {
			shopName = fromKnownAddress.name || '';
			shopDescription = fromKnownAddress.description || '';
			shopInfoInitialized = true;
		}
	});

	// Reset shopInfoInitialized when fromAddress changes
	$effect(() => {
		if (fromAddress) {
			shopInfoInitialized = false;
		}
	});
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
			overrideAddress = '';
			overrideAmount = 0;
			fieldsLocked = false;
			beforeSend = null;
		} else if (mode === 'message' && messageContent) {
			metadata = `${messageType}=${messageContent}`;
			overrideAddress = '';
			overrideAmount = 0;
			fieldsLocked = false;
			beforeSend = null;
		} else if (mode === 'actions') {
			// Actions mode uses the selected action's configuration
			overrideAddress = selectedAction.targetAddress;
			overrideAmount = selectedAction.refundsAmount ? 0 : selectedAction.fee;
			fieldsLocked = true;
			beforeSend = selectedAction.beforeSend ?? null;
			if (selectedAction.id === 'set_shop_info') {
				const parts: string[] = [];
				if (shopName.trim()) {
					parts.push(`shop_name=${shopName.trim()}`);
				}
				if (shopDescription.trim()) {
					parts.push(`shop_description=${shopDescription.trim()}`);
				}
				metadata = parts.join(';');
			} else if (selectedAction.id === 'delete_shop_info') {
				metadata = 'shop_delete';
			}
		} else if (mode === 'refund' && refundTxId.trim()) {
			const parts: string[] = [`ref=${refundTxId.trim()}`, 'type=refund'];
			if (refundOriginalAmount.trim()) {
				parts.push(`original=${refundOriginalAmount.trim()}`);
			}
			if (refundMessage.trim()) {
				parts.push(`message=${refundMessage.trim()}`);
			}
			metadata = parts.join(';');
			overrideAddress = '';
			overrideAmount = 0;
			fieldsLocked = false;
			beforeSend = null;
		} else if (mode === 'raw') {
			metadata = rawMetadata;
			overrideAddress = '';
			overrideAmount = 0;
			fieldsLocked = false;
			beforeSend = null;
		} else {
			metadata = '';
			overrideAddress = '';
			overrideAmount = 0;
			fieldsLocked = false;
			beforeSend = null;
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
				<span>{$t$('transaction.metadataModes.messageError')}</span>
			</button>
			<button
				type="button"
				class="mode-tab"
				class:active={mode === 'actions'}
				onclick={() => (mode = 'actions')}
			>
				<FontAwesomeIcon icon={faBolt} />
				<span>{$t$('transaction.metadataModes.actions')}</span>
			</button>
			<button
				type="button"
				class="mode-tab"
				class:active={mode === 'refund'}
				onclick={() => (mode = 'refund')}
			>
				<FontAwesomeIcon icon={faRotateLeft} />
				<span>{$t$('transaction.metadataModes.refund')}</span>
			</button>
			<button
				type="button"
				class="mode-tab"
				class:active={mode === 'raw'}
				onclick={() => (mode = 'raw')}
			>
				<FontAwesomeIcon icon={faCode} />
				<span>{$t$('transaction.metadataModes.rawMetadata')}</span>
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
		{:else if mode === 'actions'}
			<div class="actions-mode" in:fade={{ duration: 150, easing: cubicOut }} out:fade={{ duration: 100 }}>
				<div class="action-notice">
					<small>
						{#if selectedAction.refundsAmount}
							{$t$('transaction.metadataModes.actionRefundsAmount', { address: selectedAction.targetAddress })}
						{:else}
							{$t$('transaction.metadataModes.actionNotice', { address: selectedAction.targetAddress, amount: selectedAction.fee.toFixed(2) })}
						{/if}
					</small>
				</div>
				<div class="action-fee-badge" class:refund={selectedAction.refundsAmount}>
					{#if selectedAction.refundsAmount}
						<span class="fee-label">{$t$('transaction.metadataModes.fullRefund')}</span>
					{:else}
						<span class="fee-label">{$t$('transaction.metadataModes.fee')}:</span>
						<span class="fee-amount">{selectedAction.fee.toFixed(2)} KRO</span>
					{/if}
				</div>
				<div class="action-type-toggle">
					{#each ACTIONS as action (action.id)}
						<button
							type="button"
							class="type-btn"
							class:active={selectedActionId === action.id}
							class:danger={action.danger}
							onclick={() => (selectedActionId = action.id)}
						>
							{$t$(action.labelKey)}
						</button>
					{/each}
				</div>

				{#if selectedAction.id === 'set_shop_info'}
					<div class="shop-info-fields" in:slide={{ duration: 200, easing: cubicOut }} out:slide={{ duration: 150 }}>
						{#if fromKnownAddress}
							<div class="prefill-notice">
								<small>{$t$('transaction.metadataModes.prefillNotice')}</small>
							</div>
						{/if}
						<label>
							{$t$('transaction.metadataModes.shopName')}
							<input
								type="text"
								bind:value={shopName}
								placeholder={$t$('transaction.metadataModes.shopNamePlaceholder')}
								disabled={lock}
							/>
						</label>
						<label>
							{$t$('transaction.metadataModes.shopDescription')}
							<textarea
								bind:value={shopDescription}
								placeholder={$t$('transaction.metadataModes.shopDescriptionPlaceholder')}
								disabled={lock}
								rows="2"
							></textarea>
						</label>
						<small class="help-text">{$t$('transaction.metadataModes.shopInfoHelp')}</small>
					</div>
				{:else if selectedAction.id === 'delete_shop_info'}
					<div class="delete-section" in:slide={{ duration: 200, easing: cubicOut }} out:slide={{ duration: 150 }}>
						{#if fromKnownAddress}
							<div class="current-shop-info">
								<h4>{$t$('transaction.metadataModes.currentShopInfo')}</h4>
								<div class="info-row">
									<strong>{$t$('transaction.metadataModes.shopName')}:</strong>
									<span>{fromKnownAddress.name}</span>
								</div>
								{#if fromKnownAddress.description}
									<div class="info-row">
										<strong>{$t$('transaction.metadataModes.shopDescription')}:</strong>
										<span>{fromKnownAddress.description}</span>
									</div>
								{/if}
								<div class="info-row">
									<strong>{$t$('transaction.metadataModes.shopType')}:</strong>
									<span class="caps">{fromKnownAddress.type}</span>
								</div>
							</div>
							<div class="delete-warning">
								<p>{$t$('transaction.metadataModes.deleteShopWarning')}</p>
							</div>
						{:else}
							<div class="no-shop-info">
								<p>{$t$('transaction.metadataModes.noShopInfo')}</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else if mode === 'refund'}
			<div class="refund-mode" in:fade={{ duration: 150, easing: cubicOut }} out:fade={{ duration: 100 }}>
				<label>
					{$t$('transaction.metadataModes.transactionId')}
					<input
						type="text"
						bind:value={refundTxId}
						placeholder={$t$('transaction.metadataModes.transactionIdPlaceholder')}
						disabled={lock}
					/>
				</label>
				<label>
					{$t$('transaction.metadataModes.originalAmount')} ({$t$('transaction.metadataModes.optional')})
					<input
						type="number"
						bind:value={refundOriginalAmount}
						placeholder="0.00"
						step="0.01"
						min="0"
						disabled={lock}
					/>
				</label>
				<label>
					{$t$('transaction.metadataModes.refundMessage')} ({$t$('transaction.metadataModes.optional')})
					<input
						type="text"
						bind:value={refundMessage}
						placeholder={$t$('transaction.metadataModes.refundMessagePlaceholder')}
						disabled={lock}
					/>
				</label>
				<small class="help-text">{$t$('transaction.metadataModes.refundHelp')}</small>
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

	.type-btn.danger.active {
		background: rgba(var(--red), 0.15);
		border-color: rgba(var(--red), 0.3);
		color: rgb(var(--red));
		box-shadow: 0 0 10px rgba(var(--red), 0.2);
	}

	/* Actions mode */
	.actions-mode {
		overflow: hidden;
	}

	.action-type-toggle {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.action-notice {
		padding: 0.5rem 0.75rem;
		background: rgba(var(--theme-color-rgb), 0.1);
		border: 1px solid rgba(var(--theme-color-rgb), 0.2);
		border-radius: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.action-notice small {
		color: rgb(var(--theme-color-rgb));
		font-size: 0.75rem;
	}

	.action-fee-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.75rem;
		background: rgba(var(--yellow), 0.15);
		border: 1px solid rgba(var(--yellow), 0.25);
		border-radius: 0.375rem;
		margin-bottom: 0.75rem;
		font-size: 0.8125rem;
	}

	.action-fee-badge .fee-label {
		color: rgba(var(--yellow), 0.9);
		font-weight: 500;
	}

	.action-fee-badge .fee-amount {
		color: rgb(var(--yellow));
		font-weight: 600;
	}

	.action-fee-badge.refund {
		background: rgba(var(--green), 0.15);
		border-color: rgba(var(--green), 0.25);
	}

	.action-fee-badge.refund .fee-label {
		color: rgb(var(--green));
	}

	.prefill-notice {
		padding: 0.5rem 0.75rem;
		background: rgba(var(--green), 0.1);
		border: 1px solid rgba(var(--green), 0.2);
		border-radius: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.prefill-notice small {
		color: rgb(var(--green));
		font-size: 0.75rem;
	}

	.shop-info-fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.shop-info-fields label {
		display: block;
		font-size: 0.8125rem;
		color: var(--text-color-2);
		margin-bottom: 0.25rem;
	}

	.shop-info-fields input,
	.shop-info-fields textarea {
		font-size: 0.875rem;
	}

	.shop-info-fields textarea {
		min-height: 60px;
		resize: vertical;
	}

	.help-text {
		color: var(--text-color-2);
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	.delete-warning {
		padding: 0.75rem;
		background: rgba(var(--red), 0.1);
		border: 1px solid rgba(var(--red), 0.2);
		border-radius: 0.5rem;
		margin-top: 0.5rem;
	}

	.delete-warning p {
		color: rgb(var(--red));
		font-size: 0.875rem;
		margin: 0;
	}

	/* Refund mode */
	.refund-mode {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.refund-mode label {
		display: block;
		font-size: 0.8125rem;
		color: var(--text-color-2);
		margin-bottom: 0.25rem;
	}

	.refund-mode input {
		font-size: 0.875rem;
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

	/* Current shop info display */
	.current-shop-info {
		padding: 1rem;
		background: rgba(var(--blue), 0.08);
		border: 1px solid rgba(var(--blue), 0.2);
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.current-shop-info h4 {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.75rem 0;
		color: rgb(var(--blue));
		opacity: 0.9;
	}

	.info-row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem;
		font-size: 0.875rem;
		padding: 0.4rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.info-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.info-row strong {
		color: var(--text-color-2);
		font-weight: 500;
		font-size: 0.8125rem;
	}

	.info-row span {
		color: var(--text-color-1);
		word-break: break-word;
	}

	.no-shop-info {
		padding: 0.75rem;
		background: rgba(var(--yellow), 0.1);
		border: 1px solid rgba(var(--yellow), 0.2);
		border-radius: 0.5rem;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: rgb(var(--yellow));
	}
</style>
