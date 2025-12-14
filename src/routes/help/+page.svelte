<script lang="ts">
	import { t$ } from '$lib/i18n';
	import Section from '$lib/components/ui/Section.svelte';
	import {
		faWallet,
		faExchangeAlt,
		faShop,
		faTag,
		faCog,
		faQuestionCircle,
		faKeyboard
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	const sections = [
		{
			id: 'getting-started',
			icon: faQuestionCircle,
			titleKey: 'help.gettingStarted',
			content: [
				'help.gettingStartedContent1',
				'help.gettingStartedContent2',
				'help.gettingStartedContent3'
			]
		},
		{
			id: 'wallets',
			icon: faWallet,
			titleKey: 'help.wallets',
			content: ['help.walletsContent1', 'help.walletsContent2', 'help.walletsContent3']
		},
		{
			id: 'transactions',
			icon: faExchangeAlt,
			titleKey: 'help.transactions',
			content: [
				'help.transactionsContent1',
				'help.transactionsContent2',
				'help.transactionsContent3'
			]
		},
		{
			id: 'shops',
			icon: faShop,
			titleKey: 'help.shops',
			content: ['help.shopsContent1', 'help.shopsContent2']
		},
		{
			id: 'names',
			icon: faTag,
			titleKey: 'help.names',
			content: ['help.namesContent1', 'help.namesContent2', 'help.namesContent3']
		},
		{
			id: 'settings',
			icon: faCog,
			titleKey: 'help.settings',
			content: ['help.settingsContent1', 'help.settingsContent2']
		},
		{
			id: 'keyboard',
			icon: faKeyboard,
			titleKey: 'help.keyboard',
			content: ['help.keyboardContent1', 'help.keyboardContent2', 'help.keyboardContent3']
		}
	];
</script>

<svelte:head>
	<title>{$t$('nav.help')} - Krawlet</title>
	<meta
		name="description"
		content="User guide and help documentation for Krawlet cryptocurrency wallet application."
	/>
</svelte:head>

<main aria-labelledby="help-title">
	<h1 id="help-title">{$t$('nav.help')}</h1>

	<nav class="help-nav" aria-label={$t$('accessibility.helpNavigation')}>
		<ul>
			{#each sections as section (section.id)}
				<li>
					<a href="#{section.id}">
						<FontAwesomeIcon icon={section.icon} />
						{$t$(section.titleKey)}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<div class="help-sections">
		{#each sections as section (section.id)}
			<div id={section.id}>
				<Section>
					<h2>
						<FontAwesomeIcon icon={section.icon} />
						{$t$(section.titleKey)}
					</h2>
					{#each section.content as contentKey, i (i)}
						<p>{$t$(contentKey)}</p>
					{/each}
				</Section>
			</div>
		{/each}
	</div>
</main>

<style>
	h1 {
		color: var(--theme-color-1);
		margin-bottom: 1.5rem;
	}

	h2 {
		color: var(--theme-color-1);
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.help-nav {
		background-color: var(--background-color-1);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.help-nav ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.help-nav a {
		color: var(--theme-color-1);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.help-nav a:hover,
	.help-nav a:focus {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.help-nav a:focus-visible {
		outline: 2px solid var(--theme-color-1);
		outline-offset: 2px;
	}

	.help-sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	p {
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.6;
		margin-bottom: 0.75rem;
	}

	p:last-child {
		margin-bottom: 0;
	}

	@media (max-width: 600px) {
		.help-nav ul {
			flex-direction: column;
		}
	}
</style>
