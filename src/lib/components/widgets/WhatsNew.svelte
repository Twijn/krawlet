<script lang="ts">
	import Section from '$lib/components/ui/Section.svelte';
	import { faNewspaper } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onMount } from 'svelte';
	import ModuleLoading from './other/ModuleLoading.svelte';
	import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
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
		<ModuleLoading>
			<SkeletonTable rows={5} columns={3} />
		</ModuleLoading>
	{:else if error}
		<p class="error">{error}</p>
	{:else if commits.length === 0}
		<p>No recent commits found.</p>
	{:else}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Author</th>
						<th>Message</th>
						<th class="right">Date</th>
					</tr>
				</thead>
				<tbody>
					{#each commits as commit (commit.sha)}
						{@const date = new Date(commit.commit.author.date)}
						<tr>
							<td>
								{#if commit.author}
									<a class="author-link" href={commit.author.html_url}>
										<img
											src={commit.author.avatar_url}
											alt={commit.author.login}
											class="author-avatar"
										/>
										<span class="commit-author">
											{commit.commit.author.name}
										</span>
									</a>
								{:else}
									<small>No author</small>
								{/if}
							</td>
							<td>
								<a href={commit.html_url}>
									{commit.commit.message.split('\n')[0]}
								</a>
							</td>
							<td class="small right" title={date.toLocaleString()}>
								{relativeTime(date)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</Section>

<style>
	.author-link {
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
</style>
