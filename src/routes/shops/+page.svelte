<script lang="ts">
	import { browser } from '$app/environment';
	import Alert from '$lib/components/dialogs/Alert.svelte';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import Shops from '$lib/components/widgets/shops/Shops.svelte';
	import ShopStats from '$lib/components/widgets/shops/ShopStats.svelte';
	import { t$ } from '$lib/i18n';
	import { notifications } from '$lib/stores/notifications';
	import { refreshAllShops } from '$lib/stores/shopsync';
	import { faRefresh } from '@fortawesome/free-solid-svg-icons';
	import type { APIError } from 'kromer';

	const urlParams: URLSearchParams | null = browser
		? new URLSearchParams(window.location.search)
		: null;

	async function refreshShopSyncInformation() {
		try {
			await refreshAllShops();

			notifications.success($t$('shop.refreshedAll'))
		} catch (e) {
			const err = e as APIError;
			notifications.error(err.message ?? $t$('transaction.unknownError'));
		}
	}
</script>

<svelte:head>
	<title>Shops | Krawlet</title>
</svelte:head>

<Breadcrumbs
	navItems={[{ label: $t$('nav.shops'), href: '/shops' }]}
	buttons={[
		{
			onClick: refreshShopSyncInformation,
			icon: faRefresh,
			tk: 'common.refresh'
		}
	]}
/>

{#if urlParams && urlParams.get('error') === 'not-found'}
	<Alert variant="danger">
		<strong>{$t$('shop.notFoundTitle')}</strong>
		<p>
			{$t$('shop.notFoundMessage')}
		</p>
	</Alert>
{/if}

<ShopStats lgCols={12} />

<Shops lgCols={12} />
