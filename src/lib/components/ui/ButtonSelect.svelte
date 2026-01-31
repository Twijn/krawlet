<script lang="ts">
	type Option = {
		id: string;
		name: string;
	};

	type Size = 'sm' | 'md' | 'lg';

	let {
		vertical,
		options = $bindable(),
		selected = $bindable(),
		size = 'md',
		change = () => {}
	}: {
		vertical: boolean;
		options: Option[];
		selected?: string;
		size?: Size;
		change?: (value: string) => void;
	} = $props();

	const name = crypto.randomUUID();
</script>

<div class="select-wrapper size-{size}" class:vertical>
	{#each options as option (option.id)}
		<div class="option">
			<input
				type="radio"
				id={name + option.id}
				{name}
				value={option.id}
				bind:group={selected}
				onchange={() => change(selected ?? '')}
			/>
			<label for={name + option.id}>{option.name}</label>
		</div>
	{/each}
</div>

<style>
	.select-wrapper {
		display: flex;
		border-radius: 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		padding: 0.375rem;
		gap: 0.375rem;
		overflow: hidden;
	}

	.select-wrapper.vertical {
		flex-direction: column;
	}

	.select-wrapper input[type='radio'] {
		/* Hide visually but keep accessible for screen readers */
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.select-wrapper .option {
		position: relative;
		flex-grow: 1;
	}

	.select-wrapper .option label {
		display: block;
		background: transparent;
		color: var(--text-color-2);
		font-weight: 500;
		font-size: 0.9375rem;
		text-align: center;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			color 0.2s ease,
			transform 0.1s ease;
		user-select: none;
	}

	.select-wrapper .option label:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-color-1);
	}

	.select-wrapper .option:has(input:checked) label {
		background: rgba(var(--theme-color-rgb), 0.25);
		color: rgb(var(--theme-color-rgb));
		font-weight: 600;
	}

	.select-wrapper .option label:active {
		transform: scale(0.97);
	}

	.select-wrapper.vertical .option label {
		text-align: left;
	}

	/* Size variants */
	.select-wrapper.size-sm {
		padding: 0.25rem;
		gap: 0.25rem;
	}

	.select-wrapper.size-sm .option label {
		font-size: 0.8125rem;
		padding: 0.5rem 0.75rem;
	}

	.select-wrapper.size-lg .option label {
		font-size: 1rem;
		padding: 1rem 1.25rem;
	}
</style>
