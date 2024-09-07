<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { LinkIcon, LockIcon, StarIcon } from 'lucide-svelte';
	import type { Project } from '$lib/loc_analysis';

	export let projects: Project[] = [];
	export let sortBy: 'loc' | 'stars' | 'title' | 'recency' = 'stars';

	const formatLinesOfCode = (lines: number) => {
		if (lines < 1000) {
			return lines;
		} else if (lines < 1000000) {
			return `${(lines / 1000).toFixed(1)}K`;
		} else {
			return `${(lines / 1000000).toFixed(1)}M`;
		}
	};

	// Sort projects by the selected sort option
	$: projects = projects.sort((a, b) => {
		if (sortBy === 'loc') {
			return b.loc - a.loc;
		} else if (sortBy === 'stars') {
			return (b?.stars || 0) - (a?.stars || 0);
		} else if (sortBy === 'title') {
			return a.title.localeCompare(b.title);
		} else if (sortBy === 'recency') {
			return (
				new Date(b?.first_commit_date || '').getTime() -
				new Date(a?.first_commit_date || '').getTime()
			);
		}
		return 0;
	});
</script>

<div>
	{#each projects as project}
		<Card class="mb-4 rounded-none">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
				<CardTitle class="text-lg font-medium">
					{project.title}
				</CardTitle>
				<div class="flex items-center gap-4">
					<!-- lines of code -->
					<span class="flex items-center gap-1 text-muted-foreground">
						{formatLinesOfCode(project.loc)}
						<span class="text-xs">lines of code</span>
					</span>
					<!-- repo stars -->
					<a href={project.link} target="_blank">
						{#if project.stars}
							<span class="flex items-center gap-1 text-muted-foreground">
								{project.stars}
								<StarIcon class="h-4 w-4" />
							</span>
						{/if}
					</a>
					<!-- link if not private -->
					{#if project?.private}
						<LockIcon class="h-4 w-4 text-muted-foreground" />
					{:else}
						<a href={project.link} target="_blank">
							<LinkIcon class="h-4 w-4 text-muted-foreground" />
						</a>
					{/if}
				</div>
			</CardHeader>
			<CardContent class="p-4">
				<CardDescription class="text-md">{project.description}</CardDescription>
				<!-- Language tags -->
				<div class="mt-2 flex flex-row flex-wrap gap-2">
					{#each project.languages as language}
						<span class="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
							{language}
						</span>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/each}
</div>

<style>
	.project-item {
		margin-bottom: 1rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
	}

	.project-title {
		font-weight: bold;
	}

	.project-description {
		margin-top: 0.5rem;
	}
</style>
