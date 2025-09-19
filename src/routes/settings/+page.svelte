<script lang="ts">
	import Section from "$lib/components/ui/Section.svelte";
	import settings from "$lib/stores/settings";
	import { faCog } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';

	function onShowMetadataChange() {
		if (!$settings.showMetadata) {
			$settings.parseTransactionMessage = false;
		}
	}

	function onRelativeTimeChange() {
		if (!$settings.relativeTimeEnabled) {
			$settings.relativeTimeAbove7d = false;
		}
	}
</script>

<svelte:head>
	<title>Settings | Krawlet</title>
</svelte:head>

<h1><a href="/">Krawlet</a> <span>&raquo;</span> <a href="/settings">Settings</a></h1>

<Section lgCols={12} mdCols={12} smCols={12}>
	<h2><FontAwesomeIcon icon={faCog} /> Settings</h2>
	<fieldset>
		<legend>Address Display</legend>
		<ToggleCheckbox bind:checked={$settings.replaceAddressesWithPlayer}>
			Replace addresses with player names when possible
		</ToggleCheckbox>
		<ToggleCheckbox bind:checked={$settings.replaceAddressesWithKnown}>
			Replace known addresses (shops, verified entities, etc.) when possible
		</ToggleCheckbox>
	</fieldset>
	<fieldset>
		<legend>Transaction List</legend>
		<ToggleCheckbox bind:checked={$settings.showMetadata} onChange={onShowMetadataChange}>
			Show transaction metadata in the transaction list
		</ToggleCheckbox>
		<ToggleCheckbox bind:checked={$settings.parseTransactionMessage} disabled={!$settings.showMetadata}>
			Parse transaction metadata into readable messages when possible
		</ToggleCheckbox>
	</fieldset>
	<fieldset>
		<legend>Name List</legend>
		<ToggleCheckbox bind:checked={$settings.showOriginalOwner}>
			Show original owner of names in the name list
		</ToggleCheckbox>
		<ToggleCheckbox bind:checked={$settings.showTransferredDate}>
			Show date of last transfer in the name list
		</ToggleCheckbox>
	</fieldset>
	<fieldset>
		<legend>Date &amp; Time</legend>
		<ToggleCheckbox bind:checked={$settings.relativeTimeEnabled} onChange={onRelativeTimeChange}>
			Show relative time in transaction and names logs
		</ToggleCheckbox>
		<ToggleCheckbox bind:checked={$settings.relativeTimeAbove7d} disabled={!$settings.relativeTimeEnabled}>
			Show relative time above 7 days old
		</ToggleCheckbox>
	</fieldset>
</Section>
