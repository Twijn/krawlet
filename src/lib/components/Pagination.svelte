<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEllipsis } from '@fortawesome/free-solid-svg-icons';

	let {
		page = $bindable(1),
		limit = $bindable(10),
		total = $bindable()
	}: { page: number; limit: number; total: number } = $props();

	let maxPage: number = $derived(Math.ceil(total / limit));

	let startNumber: number = $derived(Math.max(page - 3, 0));
</script>

<nav class="pagination" aria-label="Pagination">
	<ul>
		{#if page > 1}
			<li><button onclick={() => page++} aria-label="Previous Page">&lt;</button></li>
		{/if}
		{#if startNumber > 0}
			<li><button onclick={() => (page = 1)}>1</button></li>
			{#if startNumber > 1}
				<li class="ellipsis"><FontAwesomeIcon icon={faEllipsis} /></li>
			{/if}
		{/if}
		{#each Array.from({ length: 5 }, (_, i) => i + 1) as number (number)}
			{@const pageNum = startNumber + number}
			{#if pageNum <= maxPage}
				<li>
					<button
						onclick={() => (page = pageNum)}
						aria-current={page === pageNum ? 'page' : undefined}>{pageNum}</button
					>
				</li>
			{/if}
		{/each}
		{#if startNumber + 5 < maxPage}
			{#if startNumber + 6 < maxPage}
				<li class="ellipsis"><FontAwesomeIcon icon={faEllipsis} /></li>
			{/if}
			<li><button onclick={() => (page = maxPage)}>{maxPage}</button></li>
		{/if}
		{#if page < maxPage}
			<li><button onclick={() => page++} aria-label="Next Page">&gt;</button></li>
		{/if}
	</ul>
</nav>

<style>
	nav {
		margin: 1em 0;
	}

	ul {
		display: flex;
		align-items: center;
		justify-content: center;
		list-style-type: none;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
	}

	li,
	button {
		display: block;
		min-width: 2rem;
		height: 2rem;
	}

	button,
	.ellipsis {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	button {
		background-color: rgba(255, 255, 255, 0.1);
		font-size: 1rem;
		font-family: var(--font-family), sans-serif;
		color: var(--text-color-1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.25rem;
		cursor: pointer;
		transition:
			background-color 0.2s ease-in-out,
			color 0.2s ease-in-out,
			border-color 0.2s ease-in-out;
	}

	button[aria-current='page'] {
		background-color: var(--theme-color-1);
	}

	.ellipsis {
		opacity: 0.5;
	}
</style>
