<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { faNewspaper } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onMount } from 'svelte';
	import ModuleLoading from './other/ModuleLoading.svelte';
	import { relativeTime } from '$lib/util';

	type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | null;

	const {
		lgCols = 12,
		mdCols = null,
		smCols = null,
		repository,
		description
	}: {
		lgCols?: ColumnCount;
		mdCols?: ColumnCount;
		smCols?: ColumnCount;
		repository: string;
		description?: string;
	} = $props();

	type Commit = {
		sha: string;
		html_url: string;
		commit: {
			message: string;
			author: {
				name: string;
				date: string;
			};
		};
		author?: {
			login: string;
			avatar_url: string;
			html_url: string;
		};
	};

	let commits: Commit[] = $state([]);
	let error: string | null = $state(null);
	let loading = $state(true);

	onMount(async () => {
		loading = true;
		error = null;
		try {
			const res = await fetch(`https://api.github.com/repos/${repository}/commits?per_page=5`);
			if (!res.ok) throw new Error('Failed to fetch commits');
			commits = await res.json();
		} catch (e) {
			console.error(e);
			error = (e as Error).message;
		} finally {
			loading = false;
		}
	});
</script>

<Section {lgCols} {mdCols} {smCols}>
	<h2><FontAwesomeIcon icon={faNewspaper} /> What's New in {repository}</h2>

	{#if description}
		<p>{description}</p>
	{/if}

	{#if loading}
		<ModuleLoading />
	{:else if error}
		<p class="error">{error}</p>
	{:else if commits.length === 0}
		<p>No recent commits found.</p>
	{:else}
		<ul class="commits-list">
			{#each commits as commit (commit.sha)}
				{@const date = new Date(commit.commit.author.date)}
				<li class="commit-item">
					<a class="commit-link" href={commit.html_url} target="_blank" rel="noopener">
						<strong class="commit-message">{commit.commit.message.split('\n')[0]}</strong>
					</a>
					<div class="commit-meta">
						{#if commit.author}
							<a
								href={commit.author.html_url}
								target="_blank"
								rel="noopener"
								class="author-avatar-link"
							>
								<img
									src={commit.author.avatar_url}
									alt={commit.author.login}
									class="author-avatar"
								/>
								<span class="commit-author">
									{commit.commit.author.name}
								</span>
							</a>
						{/if}
						<small class="commit-date" title={date.toLocaleString()}>
							{relativeTime(date)}
						</small>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</Section>

<style>
	.commits-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.commit-item {
		border-bottom: 1px solid var(--background-color-1);
		padding: 1rem 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.commit-item:last-child {
		border-bottom: none;
	}

	.commit-link {
		color: var(--theme-color-2);
		text-decoration: none;
		font-size: 1.05rem;
	}

	.commit-link:hover {
		text-decoration: underline;
	}

	.commit-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.92rem;
		color: var(--text-color-2);
	}

	.author-avatar-link {
		display: inline-block;
		color: var(--text-color-1);
		text-decoration: none;
	}

	.author-avatar {
		width: 1.5em;
		height: 1.5em;
		border-radius: 50%;
		margin-right: 0.3rem;
		vertical-align: middle;
		border: 0.1em solid var(--theme-color-1);
	}

	.commit-author {
		font-weight: 500;
	}
</style>
