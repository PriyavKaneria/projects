<script lang="ts">
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { ScrollArea, ScrollAreaScrollbar } from '$lib/components/ui/scroll-area';

	import ProjectList from '$lib/components/ProjectList.svelte';
	import GraphPlot from '$lib/components/GraphPlot.svelte';

	let selectedPlot = 'Code Density vs. Commit Frequency';

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

	const handleTabSelect = (tab: string | undefined) => {
		if (tab) selectedPlot = tab;
		// scroll the tab into center
		if (!tabList) return;
		const selectedTab = tabList.querySelector(`#tab-${plotOptions.indexOf(selectedPlot)}`)!;
		selectedTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
	};
</script>

<div class="flex flex-col">
	<div class="xkcd-script fixed flex h-32 w-full flex-col items-start py-6 pl-[40%]">
		<div class="p-4">
			<h1 class="mb-2 text-4xl font-bold">Stuff I made</h1>
			<p class="text-sm italic">(or contributed to)</p>
		</div>
	</div>

	<div class="xkcd-script static mt-32 flex h-full w-full">
		<!-- Left Section for Project List -->
		<div class="mb-64 w-2/5 p-4">
			<ProjectList />
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
		<div class="fixed right-0 flex w-3/5 flex-col p-4">
			<!-- Tab Bar using shadcn/ui -->
			<Tabs value={selectedPlot} onValueChange={handleTabSelect} class="w-full">
				<ScrollArea class="rounded-md">
					<ScrollAreaScrollbar orientation="horizontal" />
					<div class="relative h-10 w-full" bind:this={tabList}>
						<TabsList class="absolute flex h-10">
							{#each plotOptions as tab, index}
								<TabsTrigger value={tab} id={`tab-${index}`}>
									{tab}
								</TabsTrigger>
							{/each}
						</TabsList>
					</div>
				</ScrollArea>
			</Tabs>
			<div class="mt-4">
				<GraphPlot {selectedPlot} />
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
		height: 6px;
	}

	:global(.overflow-x-auto::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.overflow-x-auto::-webkit-scrollbar-thumb) {
		background-color: hsl(var(--muted));
		border-radius: 3px;
	}
</style>
