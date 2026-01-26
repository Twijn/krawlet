<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEllipsis, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

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
			<li>
				<button class="nav-btn" onclick={() => page--} aria-label="Previous Page">
					<FontAwesomeIcon icon={faChevronLeft} />
				</button>
			</li>
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
			<li>
				<button class="nav-btn" onclick={() => page++} aria-label="Next Page">
					<FontAwesomeIcon icon={faChevronRight} />
				</button>
			</li>
		{/if}
	</ul>
</nav>

<style>
	nav {
		margin: 1.5em 0;
	}

	ul {
		display: flex;
		align-items: center;
		justify-content: center;
		list-style-type: none;
		gap: 0.375rem;
		margin: 0;
		padding: 0;
	}

	li,
	button {
		display: block;
		min-width: 2.25rem;
		height: 2.25rem;
	}

	button,
	.ellipsis {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	button {
		background: rgba(255, 255, 255, 0.04);
		backdrop-filter: blur(8px);
		font-size: 0.95rem;
		font-family: var(--font-family), sans-serif;
		font-weight: 500;
		color: var(--text-color-1);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	button:hover:not([aria-current='page']) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.12);
		transform: translateY(-1px);
	}

	button:active {
		transform: translateY(0);
	}

	button[aria-current='page'] {
		background-color: var(--theme-color-1);
		border-color: var(--theme-color-1);
		color: white;
		font-weight: 600;
		cursor: default;
	}

	button.nav-btn {
		min-width: 2.5rem;
		font-size: 0.875rem;
	}

	button.nav-btn:hover {
		background: var(--theme-color-1);
		border-color: var(--theme-color-1);
		color: white;
	}

	.ellipsis {
		opacity: 0.4;
		font-size: 0.875rem;
	}
</style>
