<script lang="ts">
	import { browser } from "$app/environment";
	import Alert from "$lib/components/dialogs/Alert.svelte";
	import Shops from "$lib/components/widgets/shops/Shops.svelte";

    const urlParams: URLSearchParams|null = browser ? new URLSearchParams(window.location.search) : null;
</script>

<svelte:head>
    <title>Shops | Krawlet</title>
</svelte:head>

{#if urlParams && urlParams.get("error") === "not-found"}
    <Alert variant="danger">
        <strong>Not Found</strong>
        <p>
            The shop you are looking for may have been deleted or does not exist. Select a different shop below!
        </p>
    </Alert>
{/if}

<Alert variant="info">
    <strong>Shops are experimental!</strong>
    <p>
        Shops are a new feature and are still being developed. If you encounter any issues, please report them to Twijn.
    </p>
</Alert>

<h1><a href="/">Krawlet</a> <span>&raquo;</span> <a href="/shops">Shops</a></h1>

<Shops lgCols={12} />
