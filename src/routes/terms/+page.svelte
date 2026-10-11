<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';

	const lastUpdated = '2026-06-03';
</script>

<svelte:head>
	<title>Terms of Service | Krawlet</title>
	<meta
		name="description"
		content="Terms of Service for the Krawlet frontend and Krawlet API-integrated features."
	/>
</svelte:head>

<Breadcrumbs navItems={[{ label: 'Terms of Service', href: '/terms' }]} />

<article class="policy-doc col-12" aria-labelledby="terms-title">
	<header>
		<h1 id="terms-title">Terms of Service</h1>
		<p>
			Krawlet depends on Kromer and Krawlet API. API keys are optional, but no-key requests have
			stricter ratelimits and fewer features.
		</p>
		<p>By using Krawlet, you agree to these Terms.</p>
	</header>

	<h2>Service scope and third parties</h2>
	<p>
		Krawlet is primarily a frontend for Kromer API data. Krawlet API provides app-specific features
		such as key management endpoints, public ender storage item requests, and transfer/helper
		services.
	</p>
	<p>
		Kromer is a separate service. Kromer-side usage is governed by Kromer's own terms and privacy
		practices where available.
	</p>

	<h2>Keys, abuse prevention, and enforcement</h2>
	<ul>
		<li>API key use is optional, but lower/stricter rate limits may apply without a key.</li>
		<li>Keep your key private and do not share it publicly.</li>
		<li>You are responsible for activity performed with your key.</li>
	</ul>
	<p>
		Raw API keys are not stored in plaintext on the Krawlet API server; hashed key representations
		are stored.
	</p>
	<ul>
		<li>Do not abuse, overload, scrape, or disrupt Krawlet API infrastructure.</li>
		<li>Do not bypass authentication, tier limits, or abuse controls.</li>
		<li>Do not use the service for unlawful activity.</li>
	</ul>
	<p>Abuse controls include rate limiting and IP abuse blocking.</p>
	<p>We may suspend or restrict access for abuse, security issues, or policy violations.</p>

	<h2>Availability, liability, and updates</h2>
	<p>Services may change or be discontinued at any time. Terms may be updated at any time.</p>
	<p>
		To the maximum extent permitted by law, Krawlet maintainers are not liable for indirect,
		incidental, consequential, special, or punitive damages.
	</p>
	<p>
		You agree to indemnify maintainers for claims arising from misuse or violation of these Terms.
	</p>
	<p>For questions, contact maintainers through the project repository/support channels.</p>

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
