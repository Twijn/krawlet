<script lang="ts">
	import { getKrawletClient } from '$lib/api/krawlet';
	import { notifications } from '$lib/stores/notifications';
	import settings from '$lib/stores/settings';
	import Modal from '../ui/Modal.svelte';
	import Alert from './Alert.svelte';

	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	let quickCode = $state('');
	const client = getKrawletClient();

	function normalizeQuickCode(value: string) {
		quickCode = value
			.toUpperCase()
			.replace(/[^0-9]/g, '')
			.slice(0, 6);
	}

	function onSubmit() {
		client.apiKey
			.redeemQuickCode(quickCode)
			.then((apiKey) => {
				notifications.success('API key redeemed successfully!');
				$settings.krawletApiKey = apiKey.apiKey;
				onClose();
			})
			.catch((err) => {
				notifications.error(`Failed to redeem API key: ${err.message}`);
			});
	}

	function onClose() {
		open = false;
	}
</script>

<Modal {open} {onSubmit} {onClose} title="Krawlet Login" maxWidth="500px">
	<Alert noMargin variant="info"
		>Use <code>\krawlet api</code> on ReconnectedCC to generate a quick code.</Alert
	>
	<label class="quick-code-label" for="quick-code-input">
		<span>Quick Code</span>
		<input
			id="quick-code-input"
			class="quick-code-input"
			type="text"
			name="quickCode"
			bind:value={quickCode}
			oninput={(event) => normalizeQuickCode((event.currentTarget as HTMLInputElement).value)}
			required
			minlength="6"
			maxlength="6"
			spellcheck="false"
			placeholder="123456"
		/>
	</label>
</Modal>

<style>
	.quick-code-label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
		font-weight: 600;
		color: var(--text-color-1);
	}

	.quick-code-input {
		font-family: 'Space Grotesk', monospace;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: 0.34em;
		text-align: center;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease,
			background-color 0.2s ease;
	}

	.quick-code-input::placeholder {
		color: var(--text-color-2);
		opacity: 0.5;
		letter-spacing: 0.2em;
	}

	.quick-code-input:hover {
		border-color: rgba(var(--theme-color-rgb), 0.6);
	}

	.quick-code-input:focus-visible {
		outline: none;
		border-color: rgba(var(--theme-color-rgb), 0.9);
		box-shadow:
			0 0 0 2px rgba(var(--theme-color-rgb), 0.25),
			0 8px 20px rgba(0, 0, 0, 0.25);
	}
</style>
