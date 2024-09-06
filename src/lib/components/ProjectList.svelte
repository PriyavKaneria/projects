<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { LinkIcon } from 'lucide-svelte';

	export let projects = [
		{ title: 'Project 1', description: 'Description for Project 1', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' },
		{ title: 'Project 2', description: 'Description for Project 2', link: '#' }
		// Add more projects as needed
	];
</script>

<div>
	{#each projects as project}
		<Card class="mb-4 rounded-none">
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">
					{project.title}
				</CardTitle>
				<a href={project.link}>
					<LinkIcon class="h-4 w-4 text-muted-foreground" />
				</a>
			</CardHeader>
			<CardContent>
				<CardDescription>{project.description}</CardDescription>
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
