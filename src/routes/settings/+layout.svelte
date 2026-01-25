<script lang="ts">
	import { page } from '$app/state';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faGlobe, faDesktop, faBell, faServer } from '@fortawesome/free-solid-svg-icons';
	import { t$ } from '$lib/i18n';

	const { children } = $props();

	const tabs = [
		{ href: '/settings', icon: faGlobe, labelKey: 'settings.tabs.general', exact: true },
		{ href: '/settings/display', icon: faDesktop, labelKey: 'settings.tabs.display', exact: false },
		{
			href: '/settings/notifications',
			icon: faBell,
			labelKey: 'settings.tabs.notifications',
			exact: false
		},
		{ href: '/settings/advanced', icon: faServer, labelKey: 'settings.tabs.advanced', exact: false }
	];

	function isActive(href: string, exact: boolean): boolean {
		if (exact) {
			return page.url.pathname === href;
		}
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>{$t$('settings.title')} | Krawlet</title>
</svelte:head>

<div class="col-12">
	<h1>
		<a href="/">Krawlet</a> <span>&raquo;</span> <a href="/settings">{$t$('settings.title')}</a>
	</h1>

	<div class="tabs-nav" role="tablist" aria-label="Settings navigation">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				role="tab"
				aria-selected={isActive(tab.href, tab.exact)}
				class:active={isActive(tab.href, tab.exact)}
			>
				<FontAwesomeIcon icon={tab.icon} />
				<span class="tab-label">{$t$(tab.labelKey)}</span>
			</a>
		{/each}
	</div>

	<div class="tab-content">
		{@render children()}
	</div>
</div>

<style>
	.tabs-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
		margin-bottom: 1.5rem;
		padding: 0.5rem;
		background-color: var(--background-color-2);
		border-radius: 0.5rem;
	}

	.tabs-nav a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		background-color: transparent;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		color: var(--text-color-2);
		font-family: var(--font-family);
		font-size: 0.9rem;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color 0.2s,
			color 0.2s,
			border-color 0.2s;
	}

	.tabs-nav a:hover {
		background-color: rgba(255, 255, 255, 0.05);
		color: var(--text-color-1);
	}

	.tabs-nav a.active {
		background-color: var(--theme-color-1);
		color: white;
		border-color: var(--theme-color-1);
	}

	.tab-label {
		display: inline;
	}

	@media only screen and (max-width: 768px) {
		.tabs-nav {
			gap: 0.25rem;
			padding: 0.25rem;
		}

		.tabs-nav a {
			padding: 0.5rem 0.75rem;
			font-size: 0.8rem;
		}

		.tab-label {
			display: none;
		}
	}

	.tab-content {
		min-height: 400px;
	}
</style>
