<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faCopy,
		faEye,
		faList,
		faPaperPlane
	} from '@fortawesome/free-solid-svg-icons';
	import ModuleLoading from '$lib/components/widgets/other/ModuleLoading.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
	import { formatCurrency, relativeTime } from '$lib/util.js';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { browser } from '$app/environment';
	import Address from '$lib/components/widgets/addresses/Address.svelte';
	import kromer from '$lib/api/kromer';
	import type { Transaction, TransactionsResponse } from 'kromer';
	import { paramState } from '$lib/paramState.svelte.js';
	import ParsedMetadata from '$lib/components/widgets/transactions/ParsedMetadata.svelte';
	import ToggleCheckbox from '$lib/components/form/ToggleCheckbox.svelte';
	import settings from '$lib/stores/settings';
	import { SEVEN_DAYS } from '$lib/consts';
	import { t$ } from '$lib/i18n';
	import { contextMenu } from '$lib/stores/contextMenu';
	import { notifications } from '$lib/stores/notifications';
	import type { ContextMenuItem } from '$lib/components/ui/ContextMenu.svelte';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		address,
		limit = 100,
		queryPrefix = ''
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		address?: string;
		limit?: number;
		queryPrefix?: string;
	} = $props();

	let page = paramState(`${queryPrefix}page`, 1, {
		serialize: (value) => value.toString(),
		deserialize: (value) => Number(value),
		shouldSet: (value) => value >= 2
	});

	let includeMined = paramState(`${queryPrefix}incl_mined`, false, {
		serialize: (value) => value.toString(),
		deserialize: (value) => value === 'true',
		shouldSet: (value) => value
	});

	let loading: boolean = $state(false);

	const handleTransactionContextMenu = (e: MouseEvent, transaction: Transaction) => {
		e.preventDefault();

		const copyTransactionId = async () => {
			try {
				await navigator.clipboard.writeText(transaction.id.toString());
				notifications.success(`Transaction ID '${transaction.id}' copied to clipboard.`);
			} catch (err) {
				console.error(err);
				notifications.error('Failed to copy transaction ID to clipboard.');
			}
		};

		const menuItems: ContextMenuItem[] = [
			{
				label: $t$('contextMenu.viewTransaction'),
				icon: faEye,
				href: `/transactions/${transaction.id}`
			},
			{
				label: $t$('contextMenu.copyTransactionId'),
				icon: faCopy,
				action: copyTransactionId
			}
		];

		// Add send to recipient option if there's a recipient
		if (transaction.to) {
			menuItems.push(
				{ separator: true, label: '' },
				{
					label: $t$('contextMenu.sendToRecipient'),
					icon: faPaperPlane,
					href: `/transactions/new?to=${transaction.to}`
				}
			);
		}

		// Add send to sender option if there's a sender
		if (transaction.from) {
			if (!transaction.to) {
				menuItems.push({ separator: true, label: '' });
			}
			menuItems.push({
				label: $t$('contextMenu.sendToSender'),
				icon: faPaperPlane,
				href: `/transactions/new?to=${transaction.from}`
			});
		}

		contextMenu.show(e.clientX, e.clientY, menuItems);
	};

	let transactionsPromise = $derived(
		browser
			? address
				? kromer.addresses.getTransactions(address, {
						offset: (page.value - 1) * limit,
						limit
					})
				: kromer.transactions.getLatest({
						offset: (page.value - 1) * limit,
						limit,
						excludeMined: !includeMined.value
					})
			: null
	);

	let transactions: TransactionsResponse | null = $state(null);

	$effect(() => {
		loading = true;
		if (transactionsPromise) {
			transactionsPromise.then((result) => {
				transactions = result;
				loading = false;
			});
		}
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faList} /> {$t$('transaction.recentTransactions')}</h2>
	{#if transactions}
		{#if transactions.transactions.length === 0}
			<small class="none-found">
				{#if address}
					{$t$('transaction.noTransactionsFor', { address })}
				{:else}
					{$t$('transaction.noTransactions')}
				{/if}
			</small>
		{:else}
			{#if !address}
				<ToggleCheckbox bind:checked={includeMined.value} center>
					{$t$('transaction.includeWelfare')}
				</ToggleCheckbox>
			{/if}
			{#if limit > 25}
				<Pagination bind:page={page.value} total={transactions.total} {limit} />
			{:else if address}
				<a id="view-all" href="/addresses/{address}/transactions"
					>{$t$('transaction.viewAllFor', { address })}</a
				>
			{:else}
				<a id="view-all" href="/transactions">{$t$('transaction.viewAll')}</a>
			{/if}
			<div class="table-container">
				<ModuleLoading absolute={true} bind:loading />
				<table>
					<thead>
						<tr>
							<th class="center">{$t$('transaction.id')}</th>
							<th>{$t$('transaction.type')}</th>
							<th class="right">{$t$('transaction.from')}</th>
							<th class="right">{$t$('transaction.to')}</th>
							<th class="right">{$t$('transaction.value')}</th>
							{#if $settings.showMetadata}
								<th
									>{$settings.parseTransactionMessage
										? $t$('transaction.message')
										: $t$('transaction.metadata')}</th
								>
							{/if}
							<th class="right">{$t$('transaction.time')}</th>
						</tr>
					</thead>
					<tbody>
						{#each transactions.transactions as transaction (transaction.id)}
							{@const meta = kromer.transactions.parseMetadata(transaction)}
							{@const showRelative =
								$settings.relativeTimeEnabled &&
								($settings.relativeTimeAbove7d ||
									Date.now() - transaction.time.getTime() <= SEVEN_DAYS)}
							<tr oncontextmenu={(e) => handleTransactionContextMenu(e, transaction)}>
								<td class="center"><a href="/transactions/{transaction.id}">{transaction.id}</a></td
								>
								<td class="caps"
									>{transaction.type === 'mined'
										? $t$('transaction.welfare')
										: transaction.type.replace(/_/g, ' ')}</td
								>
								<td class="right">
									{#if transaction.from}
										<Address address={transaction.from} />
									{/if}
								</td>
								<td class="right">
									{#if transaction.sent_name}
										<a href="/addresses/{transaction.to}" title="Go to {transaction.to}">
											{transaction.sent_metaname
												? `${transaction.sent_metaname}@`
												: ''}{transaction.sent_name}.kro
										</a>
									{:else}
										<Address address={transaction.to} />
									{/if}
								</td>
								<td class="right">{formatCurrency(transaction.value)} <small>KRO</small></td>
								{#if $settings.showMetadata}
									<td class="metadata">
										{#if $settings.parseTransactionMessage}
											<ParsedMetadata transaction={{ ...transaction, meta }} />
										{:else if transaction.metadata && transaction.metadata.length > 0}
											<small>{transaction.metadata.substring(0, 75)}</small>
										{:else}
											<small>{$t$('transaction.noMetadata')}</small>
										{/if}
									</td>
								{/if}
								<td
									class="time right"
									title={showRelative ? transaction.time.toLocaleString() : undefined}
								>
									{#if showRelative}
										{relativeTime(transaction.time)}
									{:else}
										{transaction.time.toLocaleString()}
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<Pagination bind:page={page.value} total={transactions.total} {limit} />
		{/if}
	{:else}
		<ModuleLoading>
			<SkeletonTable rows={5} columns={6} />
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
