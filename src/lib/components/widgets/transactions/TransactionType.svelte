<script lang="ts">
	import { t$ } from '$lib/i18n';
	import type { Transaction } from 'kromer';

	let { tx }: { tx: Transaction } = $props();

	let isAdmin = $derived(tx.type === 'mined' && tx.to === 'serverwelf');
</script>

<span
	class="type"
	class:type-admin={isAdmin}
	class:type-welfare={tx.type === 'mined' && !isAdmin}
	class:type-transfer={tx.type === 'transfer'}
	class:type-name-purchase={tx.type === 'name_purchase'}
	class:type-name-a-record={tx.type === 'name_a_record'}
	class:type-name-transfer={tx.type === 'name_transfer'}
	title={isAdmin ? $t$('transaction.adminTooltip') : undefined}
>{tx.type === 'mined' ? (isAdmin ? $t$('transaction.admin') : $t$('transaction.welfare')) : tx.type.replace(/_/g, ' ')}</span>

<style>
	.type-welfare {
		color: rgb(var(--green));
	}

	.type-transfer {
		color: rgb(var(--blue));
	}

	.type-name-purchase {
		color: rgb(var(--red));
	}

	.type-name-a-record {
		color: rgb(var(--red));
	}

	.type-name-transfer {
		color: rgb(var(--red));
	}

	.type-admin {
		color: rgb(var(--orange));
		text-shadow: 0 0 2px rgba(var(--orange), 0.7);
	}

	.type {
		text-transform: capitalize;
		padding: 1em;
		border-radius: 0.25em;
		font-size: 0.9em;
		font-weight: 500;
	}
</style>
