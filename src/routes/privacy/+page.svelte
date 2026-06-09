<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';

	const lastUpdated = '2026-06-08';

	const KROMER_URL = 'https://kromer.reconnected.cc';
</script>

<svelte:head>
	<title>Privacy Policy | Krawlet</title>
	<meta
		name="description"
		content="Privacy Policy for Krawlet frontend, Krawlet API integration, and Kromer third-party service disclosures."
	/>
</svelte:head>

<Breadcrumbs navItems={[{ label: 'Privacy Policy', href: '/privacy' }]} />

<article class="policy-doc col-12" aria-labelledby="privacy-title">
	<header>
		<h1 id="privacy-title">Privacy Policy</h1>
		<p>
			Krawlet is a wallet frontend for <a
				href={KROMER_URL}
				target="_blank"
				rel="noopener noreferrer external">the Kromer API</a
			>. This policy explains what data is used, why, and your main controls.
		</p>
		<p>
			It covers the <a
				href="https://github.com/Twijn/krawlet"
				target="_blank"
				rel="noopener noreferrer external">Krawlet frontend</a
			>
			and
			<a
				href="https://github.com/Twijn/krawlet-api"
				target="_blank"
				rel="noopener noreferrer external">Krawlet API</a
			> endpoints used by the app. Core wallet and network data comes from Kromer, a separate third-party
			service with its own policies.
		</p>
	</header>

	<h2>What we use and why</h2>
	<ul>
		<li>
			<strong>Wallet data (private keys):</strong>
			Wallet private keys are encrypted and stored client-side in the browser (local storage). Your Kromer
			private key is only ever sent to the
			<a href={KROMER_URL} target="_blank" rel="noopener noreferrer external">official Kromer API</a
			>.
		</li>
		<li>
			<strong>Krawlet API usage data:</strong>
			We collect minimal logs of API requests for security and abuse prevention. This may include request
			metadata such as timestamp, IP address, endpoint accessed, or the API key used.
			<strong>These logs are automatically deleted after 7 days.</strong>
		</li>
		<li>
			<strong>Infrastructure data:</strong>
			We use third-party hosting and infrastructure providers (Vercel, Cloudflare, and others) that may
			process data necessary to operate the service, such as server logs or analytics. We do not control
			these providers' data practices.
		</li>
		<li>
			<strong>Cookies and local storage:</strong>
			The Krawlet frontend uses local storage instead of cookies for client-side data, including wallet
			data and settings. Transactions, addresses, and names are also cached inside IndexedDB for performance.
			We do not use cookies for tracking or advertising purposes.
		</li>
		<li>
			<strong>Other data collected:</strong>
			Krawlet API acts as an aggregator and proxy for
			<a
				href="https://github.com/scmcgowen/ShopSync"
				target="_blank"
				rel="noopener noreferrer external">Shopsync shop/listing data</a
			>, player-to-Kromer address mappings, known address metadata, and Shopsync report/change logs
			(for example validation failures, successful posts, and shop/item/price changes).
		</li>
	</ul>

	<footer class="meta">
		<p><strong>Last updated:</strong> {lastUpdated}</p>
	</footer>
</article>

<style>
	.policy-doc {
		max-width: 78ch;
		padding: 0.2rem 0.25rem;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	h2 {
		margin: 1.3rem 0 0.45rem;
		font-size: 1.08rem;
	}

	p {
		margin: 0.5rem 0;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.92);
	}

	ul {
		margin: 0.45rem 0 0.75rem 1.15rem;
		padding: 0;
	}

	li {
		margin: 0.28rem 0;
		line-height: 1.45;
	}

	header p:first-of-type {
		margin-top: 0.7rem;
	}

	.meta {
		margin-top: 1.3rem;
		padding-top: 0.7rem;
		border-top: 1px solid rgba(255, 255, 255, 0.14);
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 1.25rem;
	}

	@media only screen and (max-width: 768px) {
		.policy-doc {
			padding: 0.1rem 0;
		}
	}
</style>
