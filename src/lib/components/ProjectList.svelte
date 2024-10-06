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
	import RootRankIcon from '$lib/components/ranks/root.svg';
	import CoreRankIcon from '$lib/components/ranks/core.svg';
	import AscendRankIcon from '$lib/components/ranks/ascend.svg';
	import PrimeRankIcon from '$lib/components/ranks/prime.svg';

	export let projects: Project[] = [];
	export let sortBy: 'loc' | 'stars' | 'title' | 'recency' | 'rank' = 'stars';
	export let hoveredProject: string;

	const ranks = ['Root', 'Core', 'Ascend', 'Prime'];

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
		} else if (sortBy === 'rank') {
			return (b.featuredLevel || 0) - (a.featuredLevel || 0);
		}
		return 0;
	});

	$: hoveredProject &&
		(() => {
			// scroll the project into view
			const project = document.getElementById(hoveredProject.toLowerCase())!;
			if (project) {
				project.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
			}
		})();
</script>

<div>
	{#each projects as project}
		<Card
			id={String(project.title).toLowerCase()}
			class={`mb-4 rounded-none transition-all duration-100 ${hoveredProject.toLowerCase() === project.title.toLowerCase() ? 'origin-left scale-110' : ''}`}
		>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
				<CardTitle class="text-lg font-medium">
					<span class="flex items-center gap-1">
						<span
							class="items-top flex h-6 gap-1 overflow-visible rounded-md px-2 py-1 text-sm text-muted-foreground text-nowrap"
						>
							{`< `}{ranks[project.featuredLevel || 0]}{` >`}
							{#if !project.featuredLevel}
								<img src={RootRankIcon} alt="Root" class="h-8 w-8" />
							{:else if project.featuredLevel === 1}
								<img src={CoreRankIcon} alt="Core" class="h-8 w-8" />
							{:else if project.featuredLevel === 2}
								<img src={AscendRankIcon} alt="Ascend" class="h-8 w-8" />
							{:else if project.featuredLevel === 3}
								<img src={PrimeRankIcon} alt="Prime" class="h-8 w-8" />
							{/if}
						</span>
						{project.title}
					</span>
				</CardTitle>
				<div class="flex items-center gap-4">
					<!-- rank -->
					<!-- lines of code -->
					<span class="flex items-center gap-1 text-muted-foreground">
						{formatLinesOfCode(project.loc).toString().replace('.0', '')}
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
