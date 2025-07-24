<script lang="ts">
	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	export let lgCols: ColumnCount = null;
	export let mdCols: ColumnCount = null;
	export let smCols: ColumnCount = null;
</script>

<section
	class="{lgCols ? `col-${lgCols}` : ''} {mdCols ? `col-md-${mdCols}` : ''} {smCols
		? `col-sm-${smCols}`
		: ''}"
>
	<slot />
</section>

<style>
	section {
		background-color: var(--background-color-2);
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.2);
	}

	:global(section h2, section h3, section h4, section h5, section h6) {
		font-size: 0.95rem;
		font-weight: 500;
		text-transform: uppercase;
		padding: 0.8rem 1rem;
		margin: -1rem -1rem 1rem -1rem;
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem 0.5rem 0 0;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.2) inset;
	}
</style>
