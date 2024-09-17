<script lang="ts">
	import * as d3 from 'd3';
	import {
		plotMetadata,
		projectPlottingData,
		type HeatmapPlotData,
		type LorentzPlotData,
		type PlotDataType,
		type ScatterPlotData
	} from '$lib/loc_analysis';
	import { Slider } from '$lib/components/ui/slider';
	import { beforeUpdate, onDestroy } from 'svelte';

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

	let d3Timers: d3.Timer[] = [];
	let intervalId: any;

	const resetTimersIntervals = (_: string) => {
		d3Timers.forEach((timer) => timer.stop());
		d3.timerFlush();
		if (intervalId) clearInterval(intervalId);
	};

	$: resetTimersIntervals(selectedPlot);

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
		// hide tooltip on redraw
		d3.select('#right').selectAll('.my-tooltip').remove();
		// redraw based on plot type
		if (plotType === 'scatter') drawScatterPlot();
		else if (plotType === 'heatmap') drawHeatmap();
		else if (plotType === 'lorentz') drawLorentzPlot();
	};

	$: IQRFactor && handleRedraw();

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

	function drawScatterPlot() {
		// for scatter plot, plotData has an array of arrays with each array containing data for a project as 0th element
		// const scatterData = plotData.map((projectData) => projectData.data[0] as ScatterPlotData);
		const data: ScatterPlotData[] = plotData.map((projectData) => {
			const project = projectData.project;
			const projectDataArray = projectData.data[0] as ScatterPlotData;
			return {
				x: projectDataArray.x,
				y: projectDataArray.y,
				size: projectDataArray?.size || 5,
				project: project
			};
		});

		// normalize size to be between 5 and 20
		const sizeExtent = d3.extent(data, (d) => d.size) as [number, number];
		const sizeScale = d3.scaleLinear().domain(sizeExtent).range([2, 10]);

		// Get container dimensions
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
			.style('pointer-events', 'none')
			.style('transition', 'opacity 0.4s ease-in-out')
			.attr('class', 'my-tooltip');
		const rightDiv = document.getElementById('right')!;

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

		// Define scales for x and y axis ranges
		const maxX = d3.max(filteredX)!;
		const maxY = d3.max(filteredY)!;
		const maxDistance = Math.sqrt(maxX ** 2 + maxY ** 2);

		// Color scale from green (near origin) to blue, then red (towards max x and y values)
		const colorScale = d3
			.scaleSequential(
				(t) => d3.interpolateRgb('green', 'blue')(t / 2) // Green to Blue in first half
			)
			.domain([0, maxDistance / 2]);

		// Extend color scale for blue to red
		const redScale = d3
			.scaleSequential((t) => d3.interpolateRgb('blue', 'red')(t))
			.domain([maxDistance / 2, maxDistance]);

		// Function to calculate distance from origin
		const getDistanceFromOrigin = (d: { x: number; y: number }) => Math.sqrt(d.x ** 2 + d.y ** 2);
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
			.attr('fill', (d: { x: number; y: number }) => {
				const distance = getDistanceFromOrigin(d);
				return distance <= maxDistance / 2 ? colorScale(distance) : redScale(distance);
			})
			// .transition()
			// .duration(500)
			.attr('r', (d) => {
				// normalize size to be between 5 and 20
				return sizeScale(d.size || 5);
			});

		// Hover circles
		svgElement
			.selectAll('.hover-circle')
			.data(data)
			.join('circle')
			.attr('class', 'hover-circle')
			.attr('id', (d, i) => `dothover-${i}`)
			.attr('cx', (d) => x(d.x))
			.attr('cy', (d) => y(d.y))
			.attr('r', (d) =>
				// if IQRFactor is greater than 20 or x or y is in first 10% of xrange or yrange, decrease size of hover circle
				IQRFactor[0] > 20 || (Math.abs(d.x) < maxX * 0.1 && Math.abs(d.y) < maxY * 0.1)
					? sizeScale(d.size || 5)
					: sizeScale(d.size || 5) * 6
			)
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
				const index = d3.select(this).attr('id').split('-')[1];
				d3.select(`#dotted-line-${index}`).style('opacity', 0.1);
				d3.select(`#dot-${index}`).style('outline', 'none');
				hoveredProject = '';
			});
	}

	function drawHeatmap() {
		let data: HeatmapPlotData[] = [];
		plotData.forEach((projectData) => {
			const projectDataArray = projectData.data as HeatmapPlotData[];
			data = data.concat(
				projectDataArray.map((d) => ({
					x: d.x,
					y: d.y,
					z: d.z
				}))
			);
		});

		// Clear previous SVG content
		d3.select(svg).selectAll('*').remove();

		// Get container dimensions
		const width = container.clientWidth - 50;
		const height = container.clientHeight;
		const margin = { top: 20, right: 200, bottom: 100, left: 300 };

		const svgElement = d3
			.select(svg)
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`)
			.style('font-family', 'xkcd-script');

		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		// Assuming data is in the format: [{ x: string, y: string, z: number }, ...]
		const xLabels = Array.from(new Set(data.map((d) => d.x)));
		const yLabels = Array.from(new Set(data.map((d) => d.y)));

		// get min and max without outliers
		const zValues = data.map((d) => d.z);
		const zStats = calculateStats(zValues);
		const filteredZ = filterOutliers(zValues, zStats);

		// Create scales
		const x = d3.scaleBand().range([0, innerWidth]).domain(xLabels).padding(0.05);
		const y = d3.scaleBand().range([innerHeight, 0]).domain(yLabels).padding(0.05);

		// Color scale
		const colorScale = d3
			.scaleSequential(d3.interpolateViridis)
			.domain([d3.min(filteredZ) || 0, d3.max(filteredZ) || 0]);

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
		svgElement
			.append('path')
			.attr('d', wobbleLine(0, innerHeight, innerWidth, innerHeight))
			.attr('stroke', 'black')
			.attr('fill', 'none');

		const axisSelection = svgElement
			.append('g')
			.style('font-family', 'xkcd-script')
			.style('font-size', '0.7rem')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(d3.axisBottom(x));

		axisSelection
			.selectAll('text')
			.style('text-anchor', 'start')
			.attr('dx', '.8em')
			.attr('dy', '-0.15em')
			.style('transform', 'rotate(45deg)');

		axisSelection.selectAll('line').attr('stroke', 'transparent');

		svgElement
			.append('text')
			.attr('fill', 'black')
			.attr('x', innerWidth / 2)
			.attr('y', innerHeight + 70)
			.attr('text-anchor', 'middle')
			.style('font-size', '1.5rem')
			.text(plotMetadata[selectedPlot].xLabel || 'X Axis');

		// Y Axis (wobbly)
		svgElement
			.append('path')
			.attr('d', wobbleLine(0, innerHeight, 0, 0))
			.attr('stroke', 'black')
			.attr('fill', 'none');

		svgElement
			.append('g')
			.style('font-family', 'xkcd-script')
			.style('font-size', '0.6rem')
			.call(d3.axisLeft(y))
			.selectAll('line')
			.attr('stroke', 'transparent');

		svgElement
			.append('text')
			.attr('fill', 'black')
			.attr('x', -innerHeight / 2)
			.attr('y', -270)
			.attr('dy', '1em')
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.style('font-size', '1.5rem')
			.text(plotMetadata[selectedPlot].yLabel || 'Y Axis');

		// Create heatmap cells
		svgElement
			.selectAll()
			.data(data)
			.enter()
			.append('rect')
			.attr('x', (d) => x(d.x) || 0)
			.attr('y', (d) => y(d.y) || 0)
			.attr('width', x.bandwidth())
			.attr('height', y.bandwidth())
			.style('fill', (d) => colorScale(d.z))
			.style('stroke', 'white')
			.style('stroke-width', 0.5);

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
			.style('pointer-events', 'none')
			.style('transition', 'opacity 0.4s ease-in-out')
			.attr('class', 'my-tooltip');
		const rightDiv = document.getElementById('right')!;

		// Add hover effect and tooltip
		svgElement
			.selectAll('rect')
			.on('mouseover', function (event, d: any) {
				d3.select(this).style('stroke', 'black').style('stroke-width', 1);
				const offsetTop = rightDiv.offsetTop + window.scrollY;
				const offsetLeft = rightDiv.offsetLeft;

				// set hovered project
				// hoveredProject = d.y; // this is too dizzying

				tooltip
					.style('opacity', 1)
					.html(`X: ${d.x}<br>Y: ${d.y}<br>Value: ${d.z.toFixed(0)}`)
					.style('top', `${event.pageY - offsetTop - 10}px`)
					.style('left', `${event.pageX - offsetLeft + 10}px`);
			})
			.on('mouseout', function () {
				d3.select(this).style('stroke', 'white').style('stroke-width', 0.5);

				tooltip.style('opacity', 0);
				// hoveredProject = '';
			})
			.on('click', function (_, d: any) {
				// set hovered project
				hoveredProject = d.y;
				setTimeout(() => {
					hoveredProject = '';
				}, 1500);
			});

		// Add a color legend
		const legendWidth = 20;
		const legendHeight = innerHeight;
		const legendPosition = { x: innerWidth + margin.right / 2, y: margin.top };

		const legendScale = d3.scaleLinear().range([legendHeight, 0]).domain(colorScale.domain());

		const legendAxis = d3.axisRight(legendScale).tickSize(legendWidth).ticks(5);

		const legend = svgElement
			.append('g')
			.attr('transform', `translate(${legendPosition.x}, ${legendPosition.y})`);

		legend
			.selectAll('rect')
			.data(d3.range(legendHeight))
			.enter()
			.append('rect')
			.attr('x', 0)
			.attr('y', (d, i) => i)
			.attr('width', legendWidth)
			.attr('height', 1)
			.style('fill', (d) => colorScale(legendScale.invert(d)));

		legend.call(legendAxis).style('font-family', 'xkcd-script').style('font-size', '0.8rem');

		legend
			.append('text')
			.attr('fill', 'black')
			.attr('x', legendWidth / 2)
			.attr('y', -10)
			.attr('text-anchor', 'middle')
			.style('font-size', '1rem')
			.text('Value');
	}

	function drawLorentzPlot() {
		// Clear previous SVG content
		d3.select(svg).selectAll('*').remove();

		// Get container dimensions
		const width = container.clientWidth - 50;
		const height = container.clientHeight - 50;
		const margin = { top: 20, right: 20, bottom: 50, left: 50 };

		const svgElement = d3
			.select(svg)
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`)
			.style('font-family', 'xkcd-script');

		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		// 3D projection
		const projection = d3
			.geoOrthographic()
			.scale(Math.min(innerWidth, innerHeight) / 2.5)
			.translate([innerWidth / 2, innerHeight / 2]);

		// Path generator
		const path = d3.geoPath().projection(projection);

		// Create a group for the 3D plot
		const plot3D = svgElement.append('g');

		// Add a sphere for reference
		plot3D
			.append('path')
			.datum({ type: 'Sphere' })
			.attr('fill', 'none')
			.attr('stroke', '#ccc')
			.attr('d', path({ type: 'Sphere' }))
			.attr('transform', 'translate(100, 0)');

		// Add grid lines
		const gridLines = d3.geoGraticule().step([15, 15]);
		plot3D
			.append('path')
			.datum(gridLines)
			.attr('class', 'sphere-grid')
			.attr('fill', 'none')
			.attr('stroke', '#ddd')
			.attr('stroke-width', 0.5)
			.attr('d', path)
			.attr('transform', 'translate(100, 0)');

		// Add axes
		const axes = [
			{ start: [0, 0], end: [90, 0], label: plotMetadata[selectedPlot].xLabel },
			{ start: [0, 0], end: [0, 90], label: plotMetadata[selectedPlot].yLabel },
			{ start: [0, 0], end: [-90, 0], label: plotMetadata[selectedPlot].zLabel }
		];

		axes.forEach((axis) => {
			plot3D
				.append('path')
				.datum(axis)
				.attr('class', 'sphere-axis')
				.attr('fill', 'none')
				.attr('stroke', '#000')
				.attr('stroke-width', 2)
				.attr('d', (d) => path({ type: 'LineString', coordinates: [d.start, d.end] }))
				.attr('transform', 'translate(100, 0)');

			const [labelX, labelY] = projection([axis.end[0], axis.end[1]])!;
			plot3D
				.append('text')
				.attr('x', labelX)
				.attr('y', labelY - 10)
				.attr('dy', '0.35em')
				.attr('text-anchor', 'middle')
				.text(axis.label || '')
				.attr('transform', 'translate(100, 0)');
		});

		// assign random color to each project using interpolateWarm
		const colorScale = d3.scaleSequential(d3.interpolateWarm);
		const colors = plotData.map((d, i) => colorScale(i / (plotData.length - 1)));

		// legend with project names and corresponding colors
		const legend = svgElement
			.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		legend
			.selectAll('rect')
			.data(plotData)
			.enter()
			.append('rect')
			.attr('x', -80)
			.attr('y', (d, i) => i * 10)
			.attr('width', 15)
			.attr('height', 10)
			.style('fill', (d, i) => colors[i]);

		legend
			.selectAll('text')
			.data(plotData)
			.enter()
			.append('text')
			.attr('x', -58)
			.attr('y', (d, i) => i * 10 + 8)
			.style('font-size', '0.7rem')
			.text((d) => d.project)
			.style('fill', (d, i) => colors[i]);

		function animateProject(projectIndex: number) {
			const projectData = plotData[projectIndex];
			const lorentzData = projectData.data[0] as LorentzPlotData;

			// scale sigma, rho and beta to proper ranges for good lorentz attractor
			const sigma = 10;
			const rho = 28;
			const beta = 8 / 3;

			// start point scales
			const startPointXScale = d3.scaleLinear().domain([0, 500]).range([-2, 2]).clamp(true);
			const startPointYScale = d3.scaleLinear().domain([0, 2]).range([-2, 2]).clamp(true);
			const startPointZScale = d3.scaleLinear().domain([1, 10]).range([-2, 2]).clamp(true);

			const data: [number, number][] = [];
			const line = d3
				.line()
				.curve(d3.curveCardinal)
				.x((d) => d[0])
				.y((d) => d[1]);

			const track = plot3D
				.append('path')
				.attr('class', 'track')
				.attr('fill', 'none')
				.attr('stroke', (d) => colors[projectIndex])
				.attr('stroke-width', 1)
				.attr('transform', 'translate(100, 0)');

			const point = plot3D
				.append('circle')
				.attr('class', 'point')
				.attr('r', 0.5)
				.attr('fill', (d) => colors[projectIndex])
				.attr('transform', 'translate(100, 0)');

			let x = startPointXScale(lorentzData.x);
			let y = startPointYScale(lorentzData.y);
			let z = startPointZScale(lorentzData.z);
			const t = 0.01;
			const max_iter = 2000;

			function lorentz() {
				const dx = t * (sigma * (y - x));
				const dy = t * (x * (rho - z) - y);
				const dz = t * (x * y - beta * z);
				x += dx;
				y += dy;
				z += dz;
			}

			function draw() {
				// projection.rotate([(Date.now() / 50) % 360, -15]);
				const [cx, cy] = projection([x * 2, y * 2])!;
				data.push([cx, cy]);

				if (data.length > max_iter) {
					data.shift();
				}

				track.attr('d', line(data));
				point
					.attr('cx', cx)
					.attr('cy', cy)
					.attr('stroke-width', 0.5 + z * 0.1);
			}

			// Run the animation
			const timer = d3.timer(() => {
				lorentz();
				draw();
			});
			d3Timers.push(timer);
		}

		// // Add gradient for track
		// svgElement
		// 	.append('linearGradient')
		// 	.attr('id', 'line-gradient')
		// 	.attr('gradientUnits', 'userSpaceOnUse')
		// 	.attr('x1', '0%')
		// 	.attr('y1', '0%')
		// 	.attr('x2', '100%')
		// 	.attr('y2', '100%')
		// 	.selectAll('stop')
		// 	.data([
		// 		{ offset: '0%', color: '#b2182b' },
		// 		{ offset: '100%', color: '#2166ac' }
		// 	])
		// 	.enter()
		// 	.append('stop')
		// 	.attr('offset', (d) => d.offset)
		// 	.attr('stop-color', (d) => d.color);

		// Start the animation for all projects
		plotData.forEach((_, index) => animateProject(index));
		intervalId = setInterval(() => {
			d3Timers.forEach((timer) => timer.stop());
			d3.timerFlush();
			// Clear previous paths and points
			plot3D.selectAll('.point, .track').remove();
			plotData.forEach((_, index) => animateProject(index));
		}, 20000);
	}

	function handleScroll(event: any) {
		event.preventDefault();
		// increment or decrement IQRFactor based on scroll direction
		if (event.deltaY > 0) {
			IQRFactor = [IQRFactor[0] + 5];
		} else {
			IQRFactor = [IQRFactor[0] - 5];
		}
	}
</script>

<div class="flex h-full w-full flex-col items-center justify-center">
	<div bind:this={container} class="flex h-full w-full items-center justify-center">
		<svg bind:this={svg} />
	</div>
	{#if plotType !== 'heatmap' && plotType !== 'lorentz'}
		<!-- Slider for overriding IQRFactor -->
		<div class="items-top ml-[30%] flex w-full justify-start" on:wheel={handleScroll}>
			<label for="IQRFactor" class="mx-4 text-lg"> Remove outliers </label>
			<Slider bind:value={IQRFactor} min={5} max={100} step={5} class="w-96" />
			<label for="IQRFactor" class="mx-4 text-lg"> Keep outliers &nbsp; (scroll)</label>
		</div>
		<span class="ml-3 mt-3 inline w-full text-center">
			Inter Quartile Range factor : {IQRFactor}
		</span>
	{/if}
</div>
