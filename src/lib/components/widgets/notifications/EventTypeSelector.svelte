<script lang="ts">
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faArrowDown, faArrowUp, faTag, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
	import { notificationSettings } from '$lib/stores/notificationSettings';
	import { t$ } from '$lib/i18n';

	const eventTypes = [
		{
			key: 'incomingTransactions' as const,
			icon: faArrowDown,
			labelKey: 'pushNotifications.eventTypes.incoming',
			descriptionKey: 'pushNotifications.eventTypes.incomingDesc'
		},
		{
			key: 'outgoingTransactions' as const,
			icon: faArrowUp,
			labelKey: 'pushNotifications.eventTypes.outgoing',
			descriptionKey: 'pushNotifications.eventTypes.outgoingDesc'
		},
		{
			key: 'namePurchases' as const,
			icon: faTag,
			labelKey: 'pushNotifications.eventTypes.namePurchase',
			descriptionKey: 'pushNotifications.eventTypes.namePurchaseDesc'
		},
		{
			key: 'nameTransfers' as const,
			icon: faExchangeAlt,
			labelKey: 'pushNotifications.eventTypes.nameTransfer',
			descriptionKey: 'pushNotifications.eventTypes.nameTransferDesc'
		}
	];

	function handleToggle(key: keyof typeof $notificationSettings.eventTypes, value: boolean) {
		notificationSettings.setEventType(key, value);
	}
</script>

<fieldset>
	<legend>{$t$('pushNotifications.eventTypes.title')}</legend>
	<p class="section-description">{$t$('pushNotifications.eventTypes.description')}</p>

	<div class="event-types">
		{#each eventTypes as eventType (eventType.key)}
			<div class="event-type-item">
				<ToggleCheckbox
					checked={$notificationSettings.eventTypes[eventType.key]}
					onChange={() =>
						handleToggle(eventType.key, !$notificationSettings.eventTypes[eventType.key])}
				>
					<span class="event-label">
						<FontAwesomeIcon icon={eventType.icon} />
						<span class="event-text">
							<strong>{$t$(eventType.labelKey)}</strong>
							<small>{$t$(eventType.descriptionKey)}</small>
						</span>
					</span>
				</ToggleCheckbox>
			</div>
		{/each}
	</div>
</fieldset>

<style>
	.section-description {
		margin: 0 0 1rem 0;
		opacity: 0.75;
		font-size: 0.875rem;
	}

	.event-types {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.event-type-item {
		padding: 0.5rem;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 0.25rem;
	}

	.event-label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.event-label :global(svg) {
		margin-top: 0.25rem;
		opacity: 0.8;
	}

	.event-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.event-text strong {
		font-weight: 500;
	}

	.event-text small {
		opacity: 0.75;
		font-size: 0.8rem;
	}
</style>
