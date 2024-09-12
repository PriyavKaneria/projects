<script lang="ts">
	import * as d3 from 'd3';
	import {
		plotMetadata,
		projectPlottingData,
		type PlotDataType,
		type ScatterPlotData
	} from '$lib/loc_analysis';
	import { Slider } from '$lib/components/ui/slider';

	export let selectedPlot: string;
	export let hoveredProject: string;

	let svg: SVGSVGElement;
	let container: HTMLDivElement;
	let plotType: string;
	let plotData: {
		project: string;
		data: PlotDataType[];
	}[];
	let IQRFactor = [1.5];

	const handlePlotChange = (selectedPlot: string) => {
		plotType = plotMetadata[selectedPlot].type;
		plotData = Object.entries(projectPlottingData).map(([project, projectData]) => ({
			project: project,
			data: projectData[selectedPlot].value
		}));
		const recommendedIQRFactor = plotMetadata[selectedPlot].IQRFactor || 1.5;
		IQRFactor = [recommendedIQRFactor];
	};
	$: container && handlePlotChange(selectedPlot);

	const handleRedraw = () => {
		if (plotType === 'scatter') drawScatterPlot();
	};

	$: IQRFactor && handleRedraw();

	function drawScatterPlot() {
		// for scatter plot, plotData has an array of arrays with each array containing data for a project as 0th element
		// const scatterData = plotData.map((projectData) => projectData.data[0] as ScatterPlotData);
		const data: { x: number; y: number; size: number; project: string }[] = plotData.map(
			(projectData) => {
				const project = projectData.project;
				const projectDataArray = projectData.data[0] as ScatterPlotData;
				return {
					x: projectDataArray.x,
					y: projectDataArray.y,
					size: 5,
					project: project
				};
			}
		);

		const width = container.clientWidth - 50;
		const height = container.clientHeight - 50;
		const margin = { top: 20, right: 20, bottom: 100, left: 100 };

		// Clear previous SVG content
		d3.select(svg).selectAll('*').remove();

		const svgElement = d3
			.select(svg)
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`)
			.style('font-family', 'xkcd-script');

		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		// X and Y scales
		// Helper function to calculate Q1, Q3, and IQR
		function calculateStats(arr: number[]): { q1: number; q3: number; iqr: number } {
			const sorted = arr.sort((a, b) => a - b);
			const q1 = d3.quantile(sorted, 0.25) || 0;
			const q3 = d3.quantile(sorted, 0.75) || 0;
			const iqr = q3 - q1;
			return { q1, q3, iqr };
		}

		// Helper function to filter outliers
		function filterOutliers(
			arr: number[],
			{ q1, q3, iqr }: { q1: number; q3: number; iqr: number }
		): number[] {
			const lowerBound = q1 - IQRFactor[0] * iqr;
			const upperBound = q3 + IQRFactor[0] * iqr;
			// return filtered array and outliers
			return arr.filter((v) => v >= lowerBound && v <= upperBound);
		}

		// Calculate stats and filter outliers for x and y
		const xValues = data.map((d) => d.x);
		const yValues = data.map((d) => d.y);
		const xStats = calculateStats(xValues);
		const yStats = calculateStats(yValues);
		const filteredX = filterOutliers(xValues, xStats);
		const filteredY = filterOutliers(yValues, yStats);

		// Create scales without outliers
		const x = d3
			.scaleLinear()
			.domain([d3.min(filteredX) || 0, d3.max(filteredX) || 0])
			.nice()
			.range([0, innerWidth]);

		const y = d3
			.scaleLinear()
			.domain([d3.min(filteredY) || 0, d3.max(filteredY) || 0])
			.nice()
			.range([innerHeight, 0]);

		// Function to generate wobbly line
		function wobbleLine(x1: number, y1: number, x2: number, y2: number) {
			const segments = 10;
			let d = `M${x1},${y1}`;
			for (let i = 1; i <= segments; i++) {
				const x = x1 + (x2 - x1) * (i / segments);
				const y = y1 + (y2 - y1) * (i / segments);
				const wobbleX = (Math.random() - 0.5) * 4;
				const wobbleY = (Math.random() - 0.5) * 4;
				d += `L${x + wobbleX},${y + wobbleY}`;
			}
			return d;
		}

		// X Axis (wobbly)
		const xAxis = d3.axisBottom(x).tickFormat(
			// convert to K and M for large numbers
			(d) =>
				d.valueOf() < 1000
					? d.toString()
					: d.valueOf() < 1000000
						? `${(d.valueOf() / 1000).toFixed(1).replace(/\.0$/, '')}K` // replace ending .0 with empty string
						: `${(d.valueOf() / 1000000).toFixed(1).replace(/\.0$/, '')}M`
		);
		svgElement
			.append('path')
			.attr('d', wobbleLine(0, innerHeight, innerWidth, innerHeight))
			.attr('stroke', 'black')
			.attr('fill', 'none');

		svgElement
			.append('g')
			.style('font-family', 'xkcd-script')
			.style('font-size', '1rem')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(xAxis)
			.selectAll('line')
			.attr('stroke', 'transparent');

		svgElement
			.append('text')
			.attr('fill', 'black')
			.attr('x', innerWidth / 2)
			.attr('y', innerHeight + 70)
			.attr('text-anchor', 'middle')
			.style('font-size', '1.5rem')
			.text(plotMetadata[selectedPlot].xLabel || 'X Axis');

		// Y Axis (wobbly)
		const yAxis = d3.axisLeft(y).tickFormat(
			// convert to K and M for large numbers
			(d) =>
				d.valueOf() < 1000
					? d.toString()
					: d.valueOf() < 1000000
						? `${(d.valueOf() / 1000).toFixed(1).replace(/\.0$/, '')}K` // replace ending .0 with empty string
						: `${(d.valueOf() / 1000000).toFixed(1).replace(/\.0$/, '')}M`
		);
		svgElement
			.append('path')
			.attr('d', wobbleLine(0, innerHeight, 0, 0))
			.attr('stroke', 'black')
			.attr('fill', 'none');

		svgElement
			.append('g')
			.style('font-family', 'xkcd-script')
			.style('font-size', '1rem')
			.call(yAxis)
			.selectAll('line')
			.attr('stroke', 'transparent');

		svgElement
			.append('text')
			.attr('fill', 'black')
			.attr('x', -innerHeight / 2)
			.attr('y', -70)
			.attr('dy', '1em')
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.style('font-size', '1.5rem')
			.text(plotMetadata[selectedPlot].yLabel || 'Y Axis');

		// Tooltip
		const tooltip = d3
			.select('#right')
			.append('div')
			.style('position', 'absolute')
			.style('font-family', 'xkcd-script')
			.style('background', '#f0f0f0')
			.style('padding', '8px')
			.style('border-radius', '5px')
			.style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.2)')
			.style('display', 'flex')
			.style('flex-direction', 'column')
			.style('transform', 'translateX(-50%) translateY(-100%)')
			.style('opacity', 0)
			.style('transition', 'opacity 0.4s ease-in-out');
		const rightDiv = document.getElementById('right')!;
		const leftDiv = document.getElementById('left')!;

		// Dotted lines to axes
		svgElement
			.selectAll('.dotted-lines')
			.data(data)
			.join('g')
			.attr('id', (d, i) => `dotted-line-${i}`)
			.attr('class', 'dotted-lines')
			.style('opacity', 0.1)
			.each(function (d: any) {
				const g = d3.select(this);
				g.append('line')
					.attr('x1', 0)
					.attr('y1', y(d.y))
					.attr('x2', x(d.x))
					.attr('y2', y(d.y))
					.attr('stroke', 'black')
					.attr('stroke-dasharray', '2,2')
					.attr('opacity', 1);
				g.append('line')
					.attr('x1', x(d.x))
					.attr('y1', y(d.y))
					.attr('x2', x(d.x))
					.attr('y2', innerHeight)
					.attr('stroke', 'black')
					.attr('stroke-dasharray', '2,2')
					.attr('opacity', 1);
			});

		// Dots
		svgElement
			.selectAll('.dot')
			.data(data)
			.join('circle')
			.attr('class', 'dot')
			.attr('id', (d, i) => `dot-${i}`)
			.attr('cx', (d: { x: any }) => x(d.x))
			.attr('cy', (d: { y: any }) => y(d.y))
			// .attr('r', 0)
			.attr('fill', 'steelblue')
			// .transition()
			// .duration(500)
			.attr('r', (d: { size: any }) => d.size);

		// Hover circles
		svgElement
			.selectAll('.hover-circle')
			.data(data)
			.join('circle')
			.attr('class', 'hover-circle')
			.attr('id', (d, i) => `dothover-${i}`)
			.attr('cx', (d: { x: any }) => x(d.x))
			.attr('cy', (d: { y: any }) => y(d.y))
			.attr('r', (d: { size: any }) => d.size * 6)
			.attr('fill', 'transparent')
			.attr('stroke', 'transparent')
			.attr('pointer-events', 'all')
			.on('mouseover', function (event, d: any) {
				// multiline text content tooltip
				let t = tooltip
					.style('opacity', 1)
					.text(`Project: ${d.project}`)
					.attr('x', x(d.date))
					.attr('y', y(d.distance) + 10);
				t.append('tspan')
					.text(`${plotMetadata[selectedPlot].xLabel}: ${d.x}`)
					.attr('x', x(d.date))
					.attr('y', y(d.distance) + 30);
				t.append('tspan')
					.text(`${plotMetadata[selectedPlot].yLabel}: ${d.y}`)
					.attr('x', x(d.date))
					.attr('y', y(d.distance) + 50);
				const index = d3.select(this).attr('id').split('-')[1];
				d3.select(`#dotted-line-${index}`).style('opacity', 1);
				d3.select(`#dot-${index}`)
					.style('outline', 'gray dashed 1px')
					.style('outline-offset', '3px')
					.style('border-radius', '50%');

				// highlight project in parent component
				hoveredProject = d.project;
			})
			.on('mousemove', function (event) {
				const offsetTop = rightDiv.offsetTop + window.scrollY;
				const offsetLeft = rightDiv.offsetLeft;

				tooltip
					.style('top', `${event.pageY - offsetTop - 10}px`)
					.style('left', `${event.pageX - offsetLeft + 10}px`);
			})
			.on('mouseout', function () {
				tooltip.style('opacity', 0);
				setTimeout(() => {
					tooltip.style('top', '-9999px').style('left', '-9999px');
				}, 500);
				const index = d3.select(this).attr('id').split('-')[1];
				d3.select(`#dotted-line-${index}`).style('opacity', 0.1);
				d3.select(`#dot-${index}`).style('outline', 'none');
				hoveredProject = '';
			});
	}
</script>

<div class="flex h-full w-full flex-col items-center justify-center">
	<div bind:this={container} class="flex h-full w-full items-center justify-center">
		<svg bind:this={svg} />
	</div>
	<!-- Slider for overriding IQRFactor -->
	<div class="flex w-3/5 items-center justify-start">
		<label for="IQRFactor" class="mr-2 text-lg">IQRFactor:</label>
		<Slider bind:value={IQRFactor} min={0} max={100} step={0.5} class="w-96" />
		<span class="ml-2 w-10 text-lg">{IQRFactor}</span>
	</div>
</div>
