<script lang="ts">
	type Option = {
		id: string;
		name: string;
	};

	let {
		vertical,
		options = $bindable(),
		selected = $bindable(),
		change = () => {}
	}: {
		vertical: boolean;
		options: Option[];
		selected?: string;
		change?: (value: string) => void;
	} = $props();

	const name = crypto.randomUUID();
</script>

<div class="select-wrapper" class:vertical>
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
		border-radius: 0.5em;
		border: 1px solid rgba(255, 255, 255, 0.2);
		margin: 0.5em 0;
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
		background-color: rgba(255, 255, 255, 0.1);
		font-weight: 500;
		flex-grow: 1;
		text-align: center;
		transition: 0.25s background-color ease-in-out;
	}

	.select-wrapper .option:has(input:checked) {
		background-color: var(--theme-color-1);
	}
</style>
