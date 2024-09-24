<script lang="ts">
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { ScrollArea, ScrollAreaScrollbar } from '$lib/components/ui/scroll-area';

	import ProjectList from '$lib/components/ProjectList.svelte';
	import GraphPlot from '$lib/components/GraphPlot.svelte';
	import { plotNames, projects } from '$lib/loc_analysis';
	import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	// @ts-expect-error
	import milestones from 'd3-milestones';
	import 'd3-milestones/build/d3-milestones.css';
	import Slider from '$lib/components/ui/slider/slider.svelte';

	let selectedPlotIndex = 6;
	$: selectedPlot = plotNames[selectedPlotIndex];

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

	$: zoomBind = [0];
	$: zoomLevel = zoomBind[0];
	$: zoomLevel != undefined && updateTimeline && updateTimeline();
	let mouseXPosition = 0;
	let updateTimeline: () => void;
	let timelineElement: HTMLDivElement;
	let timelineTranslateX = 0;
	onMount(() => {
		// setup timeline
		const vis = milestones('#timeline')
			.mapping({
				timestamp: 'timestamp',
				text: 'title'
			})
			.parseTime('%Y-%m-%d %H:%M:%S')
			.aggregateBy('year') // Start with years
			.optimize(true)
			.orientation('horizontal')
			.useLabels(true)
			.urlTarget('_blank')
			.autoResize(true)
			.render(
				projects.map((p) => ({
					timestamp: p.first_commit_date,
					title: `${p.title}`,
					url: p.link
				}))
			);

		// Function to update timeline based on scroll
		updateTimeline = () => {
			let aggregationLevel;
			let fontSize;
			let labelFormat;

			// Dynamically set aggregation level and font size based on scrollY
			if (zoomLevel < 3) {
				aggregationLevel = 'year';
				fontSize = '14px'; // Normal font size for years
				labelFormat = '%Y'; // Adjust label format for years
			} else if (zoomLevel < 6) {
				aggregationLevel = 'month';
				fontSize = '18px'; // Zoomed in font size for months
				labelFormat = '%b %Y'; // Adjust label format for months
			} else {
				aggregationLevel = 'week';
				fontSize = '22px'; // Even larger font size for weeks
				labelFormat = '%b, %Y'; // Adjust label format for weeks
			}

			// Dynamically adjust timeline based on aggregation level and font size
			vis
				.aggregateBy(aggregationLevel)
				.useLabels(true)
				.labelFormat(labelFormat)
				.render(
					projects.map((p) => ({
						timestamp: p.first_commit_date,
						title: `${p.title}`,
						url: p.link
					}))
				);

			// Apply the font size to the timeline labels
			// document.getElementById('timeline')!.style.fontSize = fontSize;

			// Keep the mouse position at the center of the timeline
			// increase the width of the timeline to keep the mouse position at the center
			// scale it acc to timelineScroll
			const timelineScroll = zoomLevel * 100;
			timelineElement.parentElement!.style.width = `calc(100% + ${timelineScroll}px)`;
			// translate the timeline to keep the mouseXPosition at the center
			const timelineBoudingRect = timelineElement.getBoundingClientRect();
			const timelineWidth = timelineBoudingRect.width;
			const offsetLeft = timelineBoudingRect.left;
			timelineTranslateX = ((mouseXPosition - offsetLeft) * timelineScroll) / timelineWidth;

			timelineElement.style.transform = `translateX(-${timelineTranslateX}px)`;
			vis.render();
		};
	});

	const handleWheel = (event: WheelEvent) => {
		if (selectedPlot !== 'Timeline') return;
		event.preventDefault();
		if (event.deltaY < 0 && zoomLevel < 10) {
			zoomBind[0] += 1;
		} else if (event.deltaY > 0 && zoomLevel > 0) {
			zoomBind[0] -= 1;
		}
		mouseXPosition = event.clientX;
		updateTimeline();
	};

	let dragging = false;
	let dragStartX = 0;
	const handleDrag = (event: MouseEvent) => {
		if (selectedPlot !== 'Timeline' || !dragging || zoomLevel === 0) return;
		event.preventDefault();

		// translate limits
		if (timelineTranslateX + dragStartX - event.clientX < 0) {
			return;
		} else if (timelineTranslateX + dragStartX - event.clientX > zoomLevel * 100) {
			return;
		}
		mouseXPosition = event.clientX;
		timelineElement.style.transform = `translateX(-${timelineTranslateX + dragStartX - event.clientX}px)`;
	};

	$: selectedPlot && (zoomBind[0] = 0);
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

	<div class="xkcd-script static mt-32 flex h-full w-full">
		<!-- Left Section for Project List -->
		<div class="-mt-16 mb-64 w-2/5 overflow-y-visible p-4" id="left">
			<!-- sort dropdown -->
			<div class="-mt-8 mb-4 flex items-center justify-end gap-3 overflow-visible">
				<label for="sort" class="text-sm text-foreground">Sort by:</label>
				<select id="sort" class="bg-transparent text-sm text-foreground" bind:value={sortListBy}>
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
						class="pointer-events-none absolute left-4 top-0 h-full w-24 bg-gradient-to-l from-transparent to-white"
					/>
				</button>
				<ScrollArea class="z-10 rounded-md">
					<ScrollAreaScrollbar orientation="horizontal" />
					<div class="relative ml-8 h-10 w-full" bind:this={tabList}>
						<TabsList class="absolute flex h-10">
							{#each plotNames as tab, index}
								<TabsTrigger value={index.toString()} id={`tab-${index}`}>
									{tab}
								</TabsTrigger>
							{/each}
						</TabsList>
					</div>
				</ScrollArea>
				<button
					on:click={() => selectedPlotIndex < plotNames.length - 1 && selectedPlotIndex++}
					class="pointer-events-auto absolute right-0 top-9 z-20 h-6 w-6 -translate-y-1/2 transform text-gray-500"
				>
					<!-- fade out right -->
					<div
						class="pointer-events-none absolute right-4 top-0 h-full w-24 bg-gradient-to-r from-transparent to-white"
					/>
					<ChevronRightIcon class="h-6 w-6" />
				</button>
			</Tabs>
			<div
				on:wheel={handleWheel}
				on:mousedown={(event) => {
					dragging = true;
					dragStartX = event.clientX;
				}}
				on:mouseup={() => {
					dragging = false;
					timelineTranslateX += dragStartX - mouseXPosition;
				}}
				on:mouseleave={() => {
					dragging = false;
					timelineTranslateX += dragStartX - mouseXPosition;
				}}
				on:mousemove={handleDrag}
				on:mouseout={() => (dragging = false)}
				on:blur={() => (dragging = false)}
				aria-hidden={selectedPlot !== 'Timeline'}
				class="mt-4 h-full cursor-pointer overflow-x-hidden"
			>
				<div
					class={`relative h-full w-full select-none overflow-x-hidden overflow-y-hidden px-16 ${selectedPlot === 'Timeline' ? '' : 'hidden'} ${
						dragging ? 'cursor-grabbing' : 'cursor-grab'
					}`}
					bind:this={timelineElement}
				>
					<div id="timeline" class="relative my-auto h-full w-full overflow-x-hidden text-xs"></div>
				</div>
				<!-- left fade out for timeline -->
				<div
					class={`absolute left-0 top-0 h-full w-28 bg-gradient-to-l from-transparent to-white ${selectedPlot === 'Timeline' ? '' : 'hidden'}`}
				/>
				<!-- right fade out for timeline -->
				<div
					class={`absolute right-0 top-0 h-full w-28 bg-gradient-to-r from-transparent to-white ${selectedPlot === 'Timeline' ? '' : 'hidden'}`}
				/>
				<div
					class={`items-top absolute bottom-16 ml-[20%] flex w-max ${selectedPlot === 'Timeline' ? '' : 'hidden'}`}
				>
					<label for="zoom" class="mx-4 text-lg"> Zoom out </label>
					<Slider bind:value={zoomBind} min={0} max={10} step={1} class="w-96" />
					<label for="zoom" class="mx-4 text-lg"> Zoom In &nbsp; (scroll) </label>
				</div>
				{#if selectedPlot !== 'Timeline'}
					<div class="h-full w-full">
						<GraphPlot {selectedPlot} bind:hoveredProject></GraphPlot>
					</div>
				{/if}
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
