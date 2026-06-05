<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Section from '$lib/components/ui/Section.svelte';

	const effectiveDate = '2026-06-03';
	const lastUpdated = '2026-06-03';
</script>

<svelte:head>
	<title>Privacy Policy | Krawlet</title>
	<meta
		name="description"
		content="Privacy Policy for Krawlet frontend, Krawlet API integration, and Kromer third-party service disclosures."
	/>
</svelte:head>

<Breadcrumbs navItems={[{ label: 'Privacy Policy', href: '/privacy' }]} />

<Section lgCols={12}>
	<h1>Privacy Policy</h1>
	<div class="stack">
		<p>
			Krawlet is a wallet frontend for Kromer. This policy explains what data is used, why, and your
			main controls.
		</p>
		<p>
			It covers the Krawlet frontend and Krawlet API endpoints used by the app. Core wallet and
			network data comes from Kromer, a separate third-party service with its own policies.
		</p>
	</div>
</Section>

<Section lgCols={12}>
	<h2>What we use and why</h2>
	<ul class="stack-list">
		<li><strong>Local wallet data:</strong> Settings and wallet entries stored in your browser.</li>
		<li>
			<strong>Encrypted key payloads:</strong> Private key material protected by your master password.
		</li>
		<li><strong>Optional API key:</strong> Stored only if you choose to save one.</li>
		<li>
			<strong>Network data:</strong> Address and transaction data from Kromer and Krawlet API.
		</li>
		<li>
			<strong>Security telemetry:</strong> Minimal reliability and abuse-prevention data where enabled.
		</li>
	</ul>
	<ul class="stack-list compact">
		<li>Provide wallet features and app functionality.</li>
		<li>Operate Krawlet API-backed services.</li>
		<li>Prevent abuse and apply rate limiting.</li>
		<li>Meet legal obligations where required.</li>
	</ul>
</Section>

<Section lgCols={12}>
	<h2>Security, retention, and rights</h2>
	<div class="stack">
		<p>
			Local wallet data stays in your browser until you remove it. Private key material is encrypted
			client-side. Krawlet API keeps minimal security logs with limited retention (at least 7 days)
			and automatic cleanup.
		</p>
		<p>Infrastructure providers may process data needed to host and operate the service.</p>
		<p>
			Depending on your region, you may have rights to access, correct, delete, or restrict
			processing. We may update this policy over time by posting a revised version.
		</p>
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
