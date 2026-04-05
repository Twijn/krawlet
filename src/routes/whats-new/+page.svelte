<script lang="ts">
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
import WhatsNew from '$lib/components/widgets/WhatsNew.svelte';
</script>

<svelte:head>
	<title>What's New | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[
		{ label: "Home", href: "/" },
		{ label: "What's New", href: "/whats-new" },
	]}
/>

<h2 class="col-12">
	<img src="/favicon-96x96.png" alt="Krawlet Logo" />
	Krawlet
</h2>

<WhatsNew
	repository="Twijn/krawlet"
	description="Code repository for the main Krawlet app (what you're viewing now!)"
	lgCols={6}
	mdCols={12}
/>
<WhatsNew
	repository="Twijn/krawlet-api"
	description="API for Krawlet and other ReconnectedCC services. Handles in-game chatbox commands and wraps some of Kromer's APIs to be more flexible."
	lgCols={6}
	mdCols={12}
/>

<h2 class="col-12">
	<img src="/images/verified/serverwelf.png" alt="ReconnectedCC Logo" />
	ReconnectedCC / KromerSharp
</h2>

<WhatsNew repository="ReconnectedCC/KromerSharp" description="" lgCols={12} />

<style>
	h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.3em;
		font-weight: 300;
		margin: 0.25em 0;
		padding: 0;
	}

	h2 img {
		height: 1.2em;
		width: 1.2em;
	}
</style>
