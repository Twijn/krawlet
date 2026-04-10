<script lang="ts">
	import type { EnderStorageChest, EnderStorageColor } from 'krawlet-js';

	const { chest }: { chest: EnderStorageChest } = $props();

	const COLOR_MAP: Record<string, { hex: string; label: string }> = {
		white: { hex: '#f9fefe', label: 'White' },
		orange: { hex: '#f9801d', label: 'Orange' },
		magenta: { hex: '#c74ebd', label: 'Magenta' },
		lightBlue: { hex: '#3ab3da', label: 'Light Blue' },
		yellow: { hex: '#fed83d', label: 'Yellow' },
		lime: { hex: '#80c71f', label: 'Lime' },
		pink: { hex: '#f38baa', label: 'Pink' },
		gray: { hex: '#474f52', label: 'Gray' },
		lightGray: { hex: '#9d9d97', label: 'Light Gray' },
		cyan: { hex: '#169c9c', label: 'Cyan' },
		purple: { hex: '#8932b8', label: 'Purple' },
		blue: { hex: '#3c44aa', label: 'Blue' },
		brown: { hex: '#835432', label: 'Brown' },
		green: { hex: '#5e7c16', label: 'Green' },
		red: { hex: '#b02e26', label: 'Red' },
		black: { hex: '#1d1d21', label: 'Black' }
	};

	function colorHex(color: EnderStorageColor): string {
		return COLOR_MAP[color.name]?.hex ?? '#888';
	}

	function colorLabel(color: EnderStorageColor): string {
		return COLOR_MAP[color.name]?.label ?? color.name;
	}

	function colorCombo(colors: EnderStorageColor[]): string {
		return colors.map(colorLabel).join(' / ');
	}

	function chestTitle(c: EnderStorageChest): string {
		return c.displayName ?? c.name ?? colorCombo(c.colors);
	}

	function totalItems(c: EnderStorageChest): number {
		return Object.values(c.contents).reduce((s, i) => s + i.count, 0);
	}

	function maxStackSize(c: EnderStorageChest): number {
		const stacks = Object.values(c.contents)
			.map((item) => (typeof item.maxCount === 'number' && item.maxCount > 0 ? item.maxCount : 64))
			.filter((n) => Number.isFinite(n));
		return stacks.length > 0 ? Math.max(...stacks) : 64;
	}

	function estimatedCapacity(c: EnderStorageChest): number {
		return 27 * maxStackSize(c);
	}

	function fillPercent(c: EnderStorageChest): number {
		const capacity = estimatedCapacity(c);
		if (capacity <= 0) return 0;
		const percent = (totalItems(c) / capacity) * 100;
		return Math.max(0, Math.min(100, percent));
	}

	const itemEntries = $derived(Object.entries(chest.contents));
	const total = $derived(totalItems(chest));
	const capacity = $derived(estimatedCapacity(chest));
	const percent = $derived(fillPercent(chest));
</script>

<div class="card">
	<div class="card-head">
		<div class="card-head-icon" title={colorCombo(chest.colors)}>
			{#each chest.colors as color, i (i)}
				<span class="color-dot" style="background:{colorHex(color)}" aria-label={colorLabel(color)}
				></span>
			{/each}
		</div>
		<div class="card-head-text">
			<h3>{chestTitle(chest)}</h3>
			{#if chest.description}
				<details class="desc-wrap">
					<summary>Description</summary>
					<p class="desc">{chest.description}</p>
				</details>
			{/if}
		</div>
	</div>

	<hr />

	<div class="card-body">
		<div class="capacity-row">
			<div
				class="capacity-bar"
				role="meter"
				aria-label="Storage utilization"
				aria-valuenow={percent}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div class="capacity-fill" style="width: {percent.toFixed(2)}%;"></div>
			</div>
			<span class="capacity-percent">{percent.toFixed(0)}%</span>
		</div>

		<div class="stat-row">
			<span class="stat-value">{total.toLocaleString()} / {capacity.toLocaleString()} items</span>
		</div>

		{#if itemEntries.length === 0}
			<p class="empty-label">Empty</p>
		{:else}
			<ul class="contents">
				{#each itemEntries as [itemKey, item] (itemKey)}
					<li class="item-row">
						<span class="item-bullet">▪</span>
						<div class="item-detail">
							<span class="item-name" title={item.name}>{item.displayName}</span>
						</div>
						<span class="item-count">×{item.count.toLocaleString()}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<hr />
</div>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		background-color: var(--background-color-1);
		min-width: 0;
		max-width: 100%;
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 1px rgba(255, 255, 255, 0.1) inset;
		transition: all 0.2s ease;
		gap: 0.5rem;
	}

	.card:hover {
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.4),
			0 0 1px rgba(255, 255, 255, 0.15) inset;
		border-color: rgba(255, 255, 255, 0.12);
		transform: translateY(-2px);
	}

	hr {
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		margin: 0;
	}

	/* Header */
	.card-head {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.card-head-icon {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
		padding: 0.25rem 0.35rem;
		border-radius: 0.35rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		align-self: flex-start;
		margin-top: 2px;
	}

	.color-dot {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		flex-shrink: 0;
	}

	.card-head-text {
		flex: 1;
		min-width: 0;
	}

	.card-head-text h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-color-1);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.desc-wrap {
		margin-top: 0.15rem;
	}

	.desc-wrap summary {
		cursor: pointer;
		font-size: 0.72rem;
		color: var(--text-color-2);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.desc {
		display: block;
		font-size: 0.8rem;
		color: var(--text-color-2);
		margin: 0.3rem 0 0 0;
	}

	/* Body */
	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex-grow: 1;
	}

	.capacity-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.capacity-bar {
		position: relative;
		height: 0.55rem;
		flex: 1;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}

	.capacity-fill {
		height: 100%;
		background: var(--theme-color-2);
		border-radius: inherit;
		transition: width 0.2s ease;
	}

	.capacity-percent {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-color-2);
		min-width: 2.2rem;
		text-align: right;
	}

	.stat-row {
		display: flex;
		align-items: baseline;
	}

	.stat-value {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-color-1);
	}

	.contents {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.item-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.2rem 0.25rem;
		border-radius: 0.3rem;
		transition: background-color 0.15s ease;
	}

	.item-row:hover {
		background-color: rgba(255, 255, 255, 0.04);
	}

	.item-bullet {
		color: var(--text-color-2);
		font-size: 0.8rem;
		flex-shrink: 0;
		line-height: 1;
	}

	.item-detail {
		flex: 1;
		min-width: 0;
	}

	.item-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-color-1);
	}

	.item-count {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--theme-color-2);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.empty-label {
		font-size: 0.85rem;
		color: var(--text-color-2);
		font-style: italic;
		margin: 0;
	}

	@media only screen and (max-width: 600px) {
		.card-head-text h3 {
			white-space: normal;
		}
	}
</style>
