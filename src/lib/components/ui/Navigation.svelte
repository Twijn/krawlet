<script lang="ts">
	import { page } from '$app/state';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
	import {
		faAddressBook,
		faChartLine,
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
	};

	type NavigationGroup = {
		nameKey: string;
		links: NavigationLink[];
		shouldShow?: () => boolean;
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
			shouldShow: () => getSyncNode().id === "kromer",
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
				},
				{
					icon: faChartLine,
					nameKey: 'nav.reports',
					href: '/shops/reports'
				}
			]
		},
		{
			nameKey: 'nav.internalEndpoints',
			shouldShow: () => (getSyncNode().internalKey ? true : false),
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
</script>

<nav>
	<ul>
		{#each navigationGroups as group (group.nameKey)}
			{#if group.shouldShow ? group.shouldShow() : true}
				<li>
					<h2>{$t$(group.nameKey)}</h2>
					<ul>
						{#each group.links as link (link.nameKey)}
							<li>
								<a href={link.href} aria-current={isCurrent(link) ? 'page' : undefined}>
									<div class="icon">
										<FontAwesomeIcon icon={link.icon} />
									</div>
									{$t$(link.nameKey)}
								</a>
							</li>
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
		padding: 0.8em 1.2em;
		margin: 0;
		font-size: 0.75em;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.8;
	}

	a {
		display: flex;
		align-items: center;
		padding: 0.75em 1.2em;
		margin: 0.15em 0.5em;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		color: var(--text-color-1);
		font-weight: 400;
		text-decoration: none;
		position: relative;
	}

	.icon {
		display: inline-flex;
		width: 1.2em;
		height: 1.2em;
		margin-right: 0.75em;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease;
	}

	a:hover,
	a:focus-visible {
		background-color: rgba(255, 255, 255, 0.08);
		color: var(--text-color-1);
		transform: translateX(2px);
	}

	a:hover .icon {
		transform: scale(1.1);
	}

	a[aria-current='page'] {
		background: linear-gradient(
			90deg,
			rgba(var(--theme-color-rgb), 0.2) 0%,
			rgba(var(--theme-color-rgb), 0.1) 100%
		);
		color: var(--text-color-1);
		font-weight: 500;
		border-left: 3px solid rgb(var(--theme-color-rgb));
	}
</style>
