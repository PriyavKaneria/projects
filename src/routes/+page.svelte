<script lang="ts">
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { ScrollArea, ScrollAreaScrollbar } from '$lib/components/ui/scroll-area';

	import ProjectList from '$lib/components/ProjectList.svelte';
	import GraphPlot from '$lib/components/GraphPlot.svelte';
	import { projects } from '$lib/loc_analysis';
	import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-svelte';

	let selectedPlotIndex = 0;
	$: selectedPlot = plotOptions[selectedPlotIndex];

	const plotOptions = [
		'Code Density vs. Commit Frequency',
		'Language Diversity vs. Project Size',
		'Comment Ratio vs. Code Churn',
		'Commit Size Evolution',
		'Productivity Pulse',
		'Code Growth vs. Commit Frequency',
		'File Type Distribution vs. Project Size',
		'Commit Size Distribution',
		'Code Consistency Over Time',
		'Project Complexity Evolution',
		'Language Transition',
		'Commit Pattern Analysis',
		'Code-to-Resource Ratio',
		'Project Heartbeat',
		'Cross-Project Influence'
	];

	$: tabList = undefined as HTMLDivElement | undefined;
	let sortListBy: 'loc' | 'stars' | 'title' | 'recency' = 'stars';

	const handleTabSelect = (tab: string | undefined) => {
		if (tab) selectedPlotIndex = parseInt(tab);
	};

	$: selectedPlotIndex &&
		(() => {
			// scroll the tab into center
			if (!tabList) return;
			const selectedTab = tabList.querySelector(`#tab-${selectedPlotIndex}`)!;
			selectedTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
		})();

	$: hoveredProject = '';
</script>

<div class="flex flex-col">
	<div
		class="xkcd-script pointer-events-none fixed flex h-32 w-full flex-col items-start py-6 pl-[40%]"
	>
		<div class="p-4">
			<h1 class="mb-2 text-4xl font-bold">Stuff I made</h1>
			<p class="text-sm italic">(or contributed to)</p>
		</div>
	</div>

	<div class="xkcd-script static mt-32 flex h-full w-full overflow-x-hidden">
		<!-- Left Section for Project List -->
		<div class="mb-64 w-2/5 p-4" id="left">
			<!-- sort dropdown -->
			<div class="-mt-8 mb-4 flex items-center justify-end gap-3">
				<label for="sort" class="text-sm text-muted-foreground">Sort by:</label>
				<select
					id="sort"
					class="bg-transparent text-sm text-muted-foreground"
					bind:value={sortListBy}
				>
					<option value="loc">Lines of Code</option>
					<option value="stars">Stars</option>
					<option value="title">Title</option>
					<option value="recency">Recency</option>
				</select>
			</div>
			<ProjectList {projects} sortBy={sortListBy} {hoveredProject} />
		</div>

		<!-- Left section fade-out top -->
		<div
			class="pointer-events-none fixed top-0 h-48 w-2/5 bg-gradient-to-t from-transparent to-white"
		/>

		<!-- Left section fade-out bottom -->
		<div
			class="pointer-events-none fixed bottom-0 h-48 w-2/5 bg-gradient-to-b from-transparent to-white"
		/>

		<!-- Right Section for Graph Plot -->
		<div class="fixed right-0 flex h-[calc(100vh-10rem)] w-3/5 flex-col p-4" id="right">
			<!-- Tab Bar using shadcn/ui -->
			<Tabs value={selectedPlotIndex.toString()} onValueChange={handleTabSelect} class="w-full">
				<button
					on:click={() => selectedPlotIndex > 0 && selectedPlotIndex--}
					class="pointer-events-auto absolute left-0 top-9 z-20 -translate-y-1/2 transform text-gray-500"
				>
					<ChevronLeftIcon class=" h-6 w-6" />
					<!-- fade out left -->
					<div
						class="absolute left-4 top-0 h-full w-10 bg-gradient-to-l from-transparent to-white"
					/>
				</button>
				<ScrollArea class="z-10 rounded-md">
					<ScrollAreaScrollbar orientation="horizontal" />
					<div class="relative ml-8 h-10 w-full" bind:this={tabList}>
						<TabsList class="absolute flex h-10">
							{#each plotOptions as tab, index}
								<TabsTrigger value={index.toString()} id={`tab-${index}`}>
									{tab}
								</TabsTrigger>
							{/each}
						</TabsList>
					</div>
				</ScrollArea>
				<button
					on:click={() => selectedPlotIndex < plotOptions.length - 1 && selectedPlotIndex++}
					class="pointer-events-auto absolute right-0 top-9 z-20 h-6 w-6 -translate-y-1/2 transform text-gray-500"
				>
					<!-- fade out right -->
					<div
						class="absolute right-4 top-0 h-full w-10 bg-gradient-to-r from-transparent to-white"
					/>
					<ChevronRightIcon class="h-6 w-6" />
				</button>
			</Tabs>
			<div class="mt-4 h-full">
				<GraphPlot {selectedPlot} bind:hoveredProject />
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(.overflow-x-auto) {
		scrollbar-width: thin;
		scrollbar-color: hsl(var(--muted)) transparent;
	}

	:global(.overflow-x-auto::-webkit-scrollbar) {
		height: 0px;
	}

	:global(.overflow-x-auto::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.overflow-x-auto::-webkit-scrollbar-thumb) {
		background-color: hsl(var(--muted));
		border-radius: 3px;
	}
</style>
