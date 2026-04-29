<script lang="ts">
	import Button from '../ui/Button.svelte';

	const quantities: number[] = [1, 16, 32, 64, 128, 256, 512, 1024];

	let {
		label = 'Quantity',
		quantity = $bindable(64),
		min = 1,
		max = 1728,
		step = 1
	}: {
		label?: string;
		quantity?: number;
		min?: number;
		max?: number;
		step?: number;
	} = $props();
</script>

<label class="quantity-selector">
	{label}
	<input type="number" name="quantity" {min} {max} {step} bind:value={quantity} />
	<div class="buttons">
		{#each quantities as q (q)}
			{#if q >= min && q <= max}
				<Button
					variant={q === quantity ? 'primary' : 'secondary'}
					onClick={() => {
						quantity = q;
					}}
					size="small">x{q}</Button
				>
			{/if}
		{/each}
	</div>
</label>

<style>
	.quantity-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.buttons {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
