<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { browser } from '$app/environment';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCopy, faEye, faSign, faUser } from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
	import AddressModule from '$lib/components/widgets/addresses/Address.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import kromer from '$lib/api/kromer';
	import type { Name, NamesResponse } from 'kromer';
	import { relativeTime } from '$lib/util';
	import { paramState } from '$lib/paramState.svelte.js';
	import { SEVEN_DAYS } from '$lib/consts';
	import settings from '$lib/stores/settings';
	import { t$ } from '$lib/i18n';
	import { contextMenu } from '$lib/stores/contextMenu';
	import { notifications } from '$lib/stores/notifications';
	import type { ContextMenuItem } from '$lib/components/ui/ContextMenu.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		limit = 100,
		address = null,
		queryPrefix = ''
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		limit?: number;
		address?: string | null;
		queryPrefix?: string;
	} = $props();

	let page = paramState(`${queryPrefix}page`, 1, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => value >= 2
	});

	let loading: boolean = $state(false);

	let namesPromise = $derived(
		browser
			? address
				? kromer.addresses.getNames(address, {
						offset: (page.value - 1) * limit,
						limit
					})
				: kromer.names.getAll({
						offset: (page.value - 1) * limit,
						limit
					})
			: null
	);

	let names: NamesResponse | null = $state(null);

	const handleNameContextMenu = (e: MouseEvent, name: Name) => {
		e.preventDefault();

		const copyName = async () => {
			try {
				await navigator.clipboard.writeText(`${name.name}.kro`);
				notifications.success(`Name '${name.name}.kro' copied to clipboard.`);
			} catch (err) {
				console.error(err);
				notifications.error('Failed to copy name to clipboard.');
			}
		};

		const menuItems: ContextMenuItem[] = [
			{
				label: $t$('contextMenu.viewName'),
				icon: faEye,
				href: `/names/${name.name}`
			},
			{
				label: $t$('contextMenu.copyName'),
				icon: faCopy,
				action: copyName
			},
			{ separator: true, label: '' },
			{
				label: $t$('contextMenu.viewNameOwner'),
				icon: faUser,
				href: `/addresses/${name.owner}`
			}
		];

		contextMenu.show(e.clientX, e.clientY, menuItems);
	};

	$effect(() => {
		loading = true;
		if (namesPromise) {
			namesPromise.then((result) => {
				names = result;
				loading = false;
			});
		}
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faSign} /> {$t$('nav.names')}</h2>
	{#if names}
		{#if names.names.length === 0}
			<small class="none-found">
				{#if address}
					{$t$('name.noNamesFor', { address })}
				{:else}
					{$t$('name.noNames')}
				{/if}
			</small>
		{:else}
			{#if limit > 25}
				<Pagination bind:page={page.value} total={names.total} {limit} />
			{:else if address}
				<a id="view-all" href="/addresses/{address}/names">
					{$t$('name.viewAllFor', { address })}
				</a>
			{:else}
				<a id="view-all" href="/names">{$t$('name.viewAll')}</a>
			{/if}
			<div class="table-container">
				<ModuleLoading absolute={true} bind:loading />
				<table>
					<thead>
						<tr>
							<th class="right">{$t$('name.name')}</th>
							<th class="right">{$t$('name.owner')}</th>
							{#if $settings.showOriginalOwner}
								<th class="right">{$t$('name.originalOwner')}</th>
							{/if}
							<th class="right">A</th>
							{#if $settings.showTransferredDate}
								<th class="right">{$t$('name.lastTransferred')}</th>
							{/if}
							<th class="right">{$t$('name.registered')}</th>
						</tr>
					</thead>
					<tbody>
						{#each names.names as name (name.name)}
							{@const showRelativeTransferred =
								name.transferred &&
								$settings.relativeTimeEnabled &&
								($settings.relativeTimeAbove7d ||
									Date.now() - name.transferred.getTime() <= SEVEN_DAYS)}
							{@const showRelativeRegistered =
								name.registered &&
								$settings.relativeTimeEnabled &&
								($settings.relativeTimeAbove7d ||
									Date.now() - name.registered.getTime() <= SEVEN_DAYS)}
							<tr oncontextmenu={(e) => handleNameContextMenu(e, name)}>
								<td class="right"><code>{name.name}</code></td>
								<td class="right">
									<AddressModule address={name.owner} />
								</td>
								{#if $settings.showOriginalOwner}
									<td class="right">
										<AddressModule address={name.original_owner} />
									</td>
								{/if}
								<td class="right">
									{#if name.a}
										{name.a}
									{:else}
										<small>{$t$('name.noData')}</small>
									{/if}
								</td>
								{#if $settings.showTransferredDate}
									<td
										class="right"
										class:time={name.transferred}
										title={showRelativeTransferred
											? name?.transferred?.toLocaleString()
											: undefined}
									>
										{#if name.transferred}
											{#if showRelativeTransferred}
												{relativeTime(name.transferred)}
											{:else}
												{name.transferred.toLocaleString()}
											{/if}
										{:else}
											<small>{$t$('name.neverTransferred')}</small>
										{/if}
									</td>
								{/if}
								<td
									class="right time"
									title={showRelativeRegistered ? name.registered.toLocaleString() : undefined}
								>
									{#if showRelativeRegistered}
										{relativeTime(name.registered)}
									{:else}
										{name.registered.toLocaleString()}
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<Pagination bind:page={page.value} total={names.total} {limit} />
		{/if}
	{:else}
		<ModuleLoading>
			<SkeletonTable rows={5} columns={4} />
		</ModuleLoading>
	{/if}
</Section>

<style>
	#view-all {
		display: block;
		text-align: center;
		font-size: 0.8em;
		color: var(--text-color-2);
		margin: 1em 0;
	}

	code {
		display: inline-block;
		background-color: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 0.25em 0.5em;
		border-radius: 0.25em;
	}

	code::after {
		content: '.kro';
		opacity: 0.75;
	}

	.none-found {
		display: block;
		color: rgb(var(--red));
		text-align: center;
	}

	.time {
		font-size: 0.9rem;
	}

	tbody tr {
		cursor: context-menu;
		transition: background-color 0.15s ease;
	}

	tbody tr:hover {
		background-color: rgba(var(--theme-color-rgb), 0.05);
	}
</style>
