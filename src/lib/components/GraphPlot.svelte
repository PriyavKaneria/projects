<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	export let selectedPlot: string;

	let svg: SVGSVGElement;
	let container: HTMLDivElement;

	const plotData: {
		[key: string]: { x: number; y: number; size: number }[];
	} = {
		// Example data structure
		'Code Density vs. Commit Frequency': [
			{ x: 10, y: 2, size: 30 },
			{ x: 20, y: 4, size: 20 }
			// More data...
		]
		// Add data for other plots
	};

	$: if (selectedPlot && container) {
		drawPlot();
	}

	function drawPlot() {
		const data = plotData[selectedPlot] || [];

		const width = container.clientWidth;
		const height = container.clientHeight;

		// Clear previous SVG content
		d3.select(svg).selectAll('*').remove();

		const svgElement = d3.select(svg).attr('width', width).attr('height', height);

		// Example scatter plot setup
		const x = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d: { x: any }) => d.x)])
			.range([0, width]);
		const y = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d: { y: any }) => d.y)])
			.range([height, 0]);

		svgElement
			.selectAll('circle')
			.data(data)
			.join(
				(enter: any) => enter.append('circle').attr('fill', 'steelblue').attr('r', 0),
				(update: any) => update,
				(exit: { remove: () => any }) => exit.remove()
			)
			.attr('cx', (d: { x: any }) => x(d.x))
			.attr('cy', (d: { y: any }) => y(d.y))
			.transition()
			.duration(500)
			.attr('r', (d: { size: any }) => d.size);
	}
</script>

<div bind:this={container} class="h-full w-full">
	<svg bind:this={svg} />
</div>
