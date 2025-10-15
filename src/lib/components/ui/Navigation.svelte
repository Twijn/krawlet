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
		faShop,
		faSign,
		faWallet
	} from '@fortawesome/free-solid-svg-icons';
	import { getSyncNode, SYNC_NODE_OFFICIAL } from '$lib/consts';

	type NavigationLink = {
		icon: IconDefinition;
		name: string;
		href: string;
		startsWith?: boolean;
		hideOnInternal?: boolean;
		hideOnExternal?: boolean;
	};

	type NavigationGroup = {
		name: string;
		links: NavigationLink[];
		hideOnInternal?: boolean;
		hideOnExternal?: boolean;
	};

	const navigationGroups: NavigationGroup[] = [
		{
			name: 'Homepage',
			links: [
				{
					icon: faHome,
					name: 'Home',
					href: '/'
				}
			]
		},
		{
			name: 'Wallets',
			links: [
				{
					icon: faWallet,
					name: 'Wallets',
					href: '/wallets'
				}
			]
		},
		{
			name: 'Transactions',
			links: [
				{
					icon: faPaperPlane,
					name: 'Send Kromer',
					href: '/transactions/new'
				},
				{
					icon: faAddressBook,
					name: 'View Transactions',
					href: '/transactions',
					startsWith: true
				}
			]
		},
		{
			name: 'Names',
			links: [
				{
					icon: faFont,
					name: 'Manage Names',
					href: '/names/manage'
				},
				{
					icon: faSign,
					name: 'All Names',
					href: '/names',
					startsWith: true
				}
			]
		},
		{
			name: 'Addresses',
			links: [
				{
					icon: faMoneyBillWave,
					name: 'Richest Addresses',
					href: '/addresses/rich'
				},
				{
					icon: faAddressBook,
					name: 'All Addresses',
					href: '/addresses',
					startsWith: true
				}
			]
		},
		{
			name: 'Reconnected.CC',
			hideOnExternal: true,
			links: [
				{
					icon: faShop,
					name: 'Shops',
					href: '/shops',
					startsWith: true
				},
				{
					icon: faListNumeric,
					name: 'Items',
					href: '/shops/items'
				}
			]
		},
		{
			name: 'Internal Endpoints',
			hideOnInternal: true,
			links: [
				{
					icon: faWallet,
					name: 'Create Wallet',
					href: '/internal/create-wallet'
				},
				{
					icon: faPaperPlane,
					name: 'Give Money',
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
					if (pathname === sublink.href && link.name !== sublink.name) {
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
		{#each navigationGroups as group (group.name)}
			{#if shouldShow(group.hideOnInternal, group.hideOnExternal)}
				<li>
					<h2>{group.name}</h2>
					<ul>
						{#each group.links as link (link.name)}
							{#if shouldShow(link.hideOnInternal, link.hideOnExternal)}
								<li>
									<a href={link.href} aria-current={isCurrent(link) ? 'page' : undefined}>
										<div class="icon">
											<FontAwesomeIcon icon={link.icon} />
										</div>
										{link.name}
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
