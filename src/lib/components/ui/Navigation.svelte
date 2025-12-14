<script lang="ts">
	import { page } from '$app/state';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
	import {
		faAddressBook,
		faFont,
		faHome,
		faListNumeric,
		faMoneyBillWave,
		faPaperPlane,
		faSearch,
		faShop,
		faSign,
		faWallet
	} from '@fortawesome/free-solid-svg-icons';
	import { getSyncNode, SYNC_NODE_OFFICIAL } from '$lib/consts';
	import { t$ } from '$lib/i18n';

	type NavigationLink = {
		icon: IconDefinition;
		nameKey: string;
		href: string;
		startsWith?: boolean;
		hideOnInternal?: boolean;
		hideOnExternal?: boolean;
	};

	type NavigationGroup = {
		nameKey: string;
		links: NavigationLink[];
		hideOnInternal?: boolean;
		hideOnExternal?: boolean;
	};

	const navigationGroups: NavigationGroup[] = [
		{
			nameKey: 'nav.homepage',
			links: [
				{
					icon: faHome,
					nameKey: 'nav.home',
					href: '/'
				}
			]
		},
		{
			nameKey: 'nav.wallets',
			links: [
				{
					icon: faWallet,
					nameKey: 'nav.wallets',
					href: '/wallets'
				}
			]
		},
		{
			nameKey: 'nav.transactions',
			links: [
				{
					icon: faPaperPlane,
					nameKey: 'nav.sendKromer',
					href: '/transactions/new'
				},
				{
					icon: faAddressBook,
					nameKey: 'nav.viewTransactions',
					href: '/transactions',
					startsWith: true
				}
			]
		},
		{
			nameKey: 'nav.names',
			links: [
				{
					icon: faFont,
					nameKey: 'nav.manageNames',
					href: '/names/manage'
				},
				{
					icon: faSign,
					nameKey: 'nav.allNames',
					href: '/names',
					startsWith: true
				}
			]
		},
		{
			nameKey: 'nav.addresses',
			links: [
				{
					icon: faSearch,
					nameKey: 'nav.searchAddresses',
					href: '/addresses/search'
				},
				{
					icon: faMoneyBillWave,
					nameKey: 'nav.richestAddresses',
					href: '/addresses/rich'
				},
				{
					icon: faAddressBook,
					nameKey: 'nav.allAddresses',
					href: '/addresses',
					startsWith: true
				}
			]
		},
		{
			nameKey: 'nav.reconnectedCC',
			hideOnExternal: true,
			links: [
				{
					icon: faShop,
					nameKey: 'nav.shops',
					href: '/shops',
					startsWith: true
				},
				{
					icon: faListNumeric,
					nameKey: 'nav.items',
					href: '/shops/items'
				}
			]
		},
		{
			nameKey: 'nav.internalEndpoints',
			hideOnInternal: true,
			links: [
				{
					icon: faWallet,
					nameKey: 'nav.createWallet',
					href: '/internal/create-wallet'
				},
				{
					icon: faPaperPlane,
					nameKey: 'nav.giveMoney',
					href: '/internal/give-money'
				}
			]
		}
	];

	function isCurrent(link: NavigationLink) {
		const pathname = page.url.pathname.toLowerCase();

		if (link.href === pathname) {
			return true;
		} else if (link.startsWith && pathname.startsWith(link.href)) {
			for (const group of navigationGroups) {
				for (const sublink of group.links) {
					if (pathname === sublink.href && link.nameKey !== sublink.nameKey) {
						return false;
					}
				}
			}
			return true;
		}
		return false;
	}

	const isInternal = SYNC_NODE_OFFICIAL.url === getSyncNode().url;
	function shouldShow(hideInternal?: boolean, hideExternal?: boolean) {
		if (isInternal && hideInternal) {
			return false;
		} else if (!isInternal && hideExternal) {
			return false;
		}
		return true;
	}
</script>

<nav>
	<ul>
		{#each navigationGroups as group (group.nameKey)}
			{#if shouldShow(group.hideOnInternal, group.hideOnExternal)}
				<li>
					<h2>{$t$(group.nameKey)}</h2>
					<ul>
						{#each group.links as link (link.nameKey)}
							{#if shouldShow(link.hideOnInternal, link.hideOnExternal)}
								<li>
									<a href={link.href} aria-current={isCurrent(link) ? 'page' : undefined}>
										<div class="icon">
											<FontAwesomeIcon icon={link.icon} />
										</div>
										{$t$(link.nameKey)}
									</a>
								</li>
							{/if}
						{/each}
					</ul>
				</li>
			{/if}
		{/each}
	</ul>
</nav>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	h2 {
		color: var(--text-color-2);
		padding: 0.8em;
		margin: 0;
		font-size: 0.9em;
		font-weight: 500;
		text-transform: uppercase;
	}

	a {
		display: flex;
		align-items: center;
		padding: 0.8em 1.5em;
		transition: 250ms;
		color: var(--text-color-1);
		font-weight: 300;
		text-decoration: none;
	}

	.icon {
		display: inline-flex;
		width: 1.1em;
		height: 1.1em;
		margin-right: 0.5em;
		align-items: center;
		justify-content: center;
	}

	a:hover,
	a:focus-visible {
		background-color: rgba(0, 0, 0, 0.25);
	}

	a[aria-current='page'] {
		background-color: var(--theme-color-1);
	}
</style>
