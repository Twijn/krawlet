<script lang="ts">
	import { getListingsByItem } from "$lib/stores/shopsync";

    console.log(getListingsByItem());
</script>

<svelte:head>
    <title>Shop Items | Krawlet</title>
</svelte:head>

<h1>
    <a href="/">Krawlet</a> <span>&raquo;</span>
    <a href="/shops">Shops</a> <span>&raquo;</span>
    <a href="/shops/items">Items</a>
</h1>