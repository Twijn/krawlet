<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Section from '$lib/components/ui/Section.svelte';

	const effectiveDate = '2026-06-03';
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

<Section lgCols={12}>
	<h1>Terms of Service</h1>
	<div class="stack">
		<p>
			Krawlet depends on Kromer and Krawlet API. API keys are optional, but no-key requests may have
			stricter rate limits.
		</p>
		<p>By using Krawlet, you agree to these Terms.</p>
	</div>
</Section>

<Section lgCols={12}>
	<h2>Service scope and third parties</h2>
	<div class="stack">
		<p>
			Krawlet is primarily a frontend for Kromer API data. Krawlet API provides app-specific
			features such as key management endpoints, public ender storage item requests, and
			transfer/helper services.
		</p>
		<p>
			Kromer is a separate service. Kromer-side usage is governed by Kromer's own terms and privacy
			practices where available.
		</p>
	</div>
</Section>

<Section lgCols={12}>
	<h2>Keys, abuse prevention, and enforcement</h2>
	<ul class="stack-list">
		<li>API key use is optional, but lower/stricter rate limits may apply without a key.</li>
		<li>Keep your key private and do not share it publicly.</li>
		<li>You are responsible for activity performed with your key.</li>
	</ul>
	<div class="stack">
		<p>Raw API keys are not stored in plaintext; hashed key representations are stored.</p>
	</div>
	<ul class="stack-list compact">
		<li>Do not abuse, overload, scrape, or disrupt Krawlet API infrastructure.</li>
		<li>Do not bypass authentication, tier limits, or abuse controls.</li>
		<li>Do not use the service for unlawful activity.</li>
	</ul>
	<div class="stack">
		<p>Abuse controls include rate limiting and IP abuse blocking.</p>
		<p>We may suspend or restrict access for abuse, security issues, or policy violations.</p>
	</div>
</Section>

<Section lgCols={12}>
	<h2>Availability, liability, and updates</h2>
	<div class="stack">
		<p>
			Services may change or be discontinued at any time. Terms may be updated by posting a revised
			version.
		</p>
		<p>Krawlet is provided "as is" and "as available," to the extent permitted by law.</p>
		<p>
			To the maximum extent permitted by law, Krawlet maintainers are not liable for indirect,
			incidental, consequential, special, or punitive damages.
		</p>
		<p>
			You agree to indemnify maintainers for claims arising from misuse or violation of these Terms.
		</p>
		<p>For questions, contact maintainers through the project repository/support channels.</p>
		<div class="dates">
			<p><strong>Effective date:</strong> {effectiveDate}</p>
			<p><strong>Last updated:</strong> {lastUpdated}</p>
		</div>
	</div>
</Section>

<style>
	h1 {
		margin: 0;
	}

	h2 {
		margin-top: 0;
		margin-bottom: 0.4rem;
		font-size: 1.02rem;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.stack-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin: 0.1rem 0 0 1.1rem;
		padding: 0;
	}

	.stack-list.compact {
		margin-top: 0.55rem;
	}

	.stack p {
		margin: 0;
	}

	.dates {
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem 1.4rem;
		padding-top: 0.2rem;
	}
</style>
