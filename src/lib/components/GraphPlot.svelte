<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	export let selectedPlot: string;

	let svg: SVGSVGElement;
	let container: HTMLDivElement;

	const plotData: {
		[key: string]: { x: number; y: number; size: number; project: string }[];
	} = {
		'Code Density vs. Commit Frequency': [
			{ x: 10, y: 2, size: 5, project: 'Project A' },
			{ x: 50, y: 4, size: 9, project: 'Project B' },
			{ x: 30, y: 6, size: 10, project: 'Project C' },
			{ x: 40, y: 8, size: 4, project: 'Project D' },
			{ x: 60, y: 10, size: 5, project: 'Project E' },
			{ x: 20, y: 12, size: 6, project: 'Project F' },
			{ x: 70, y: 14, size: 7, project: 'Project G' },
			{ x: 30, y: 16, size: 8, project: 'Project H' },
			{ x: 90, y: 18, size: 3, project: 'Project I' },
			{ x: 80, y: 20, size: 10, project: 'Project J' }
		]
		// Add data for other plots
	};

	$: if (selectedPlot && container) {
		drawPlot();
	}

	function drawPlot() {
		const data = plotData[selectedPlot] || [];

		const width = container.clientWidth - 100;
		const height = container.clientHeight - 100;
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
		const x = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d: { x: any }) => d.x)])
			.nice()
			.range([0, innerWidth]);

		const y = d3
			.scaleLinear()
			.domain([0, d3.max(data, (d: { y: any }) => d.y)])
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
		const xAxis = d3.axisBottom(x);
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
			.text('Code Density');

		// Y Axis (wobbly)
		const yAxis = d3.axisLeft(y);
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
			.text('Commit Frequency');

		// Tooltip
		const tooltip = d3
			.select('body')
			.append('div')
			.style('position', 'absolute')
			.style('font-family', 'xkcd-script')
			.style('visibility', 'hidden')
			.style('background', '#f0f0f0')
			.style('padding', '8px')
			.style('border-radius', '5px')
			.style('box-shadow', '0 0 10px rgba(0, 0, 0, 0.2)')
			.style('display', 'flex')
			.style('flex-direction', 'column')
			.style('transform', 'translateX(-50%) translateY(-100%)');

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
			.attr('r', 0)
			.attr('fill', 'steelblue')
			.transition()
			.duration(500)
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
					.style('visibility', 'visible')
					.text(`Project: ${d.project}`)
					.attr('x', x(d.date))
					.attr('y', y(d.distance) + 10);
				t.append('tspan')
					.text(`Density: ${d.x}`)
					.attr('x', x(d.date))
					.attr('y', y(d.distance) + 30);
				t.append('tspan')
					.text(`Frequency: ${d.y}`)
					.attr('x', x(d.date))
					.attr('y', y(d.distance) + 50);
				const index = d3.select(this).attr('id').split('-')[1];
				d3.select(`#dotted-line-${index}`).style('opacity', 1);
				d3.select(`#dot-${index}`)
					.style('outline', 'gray dashed 1px')
					.style('outline-offset', '3px')
					.style('border-radius', '50%');
			})
			.on('mousemove', function (event) {
				tooltip.style('top', `${event.pageY - 10}px`).style('left', `${event.pageX + 10}px`);
			})
			.on('mouseout', function () {
				tooltip.style('visibility', 'hidden');
				const index = d3.select(this).attr('id').split('-')[1];
				d3.select(`#dotted-line-${index}`).style('opacity', 0.1);
				d3.select(`#dot-${index}`).style('outline', 'none');
			});
	}
</script>

<div bind:this={container} class="flex h-full w-full items-center justify-center">
	<svg bind:this={svg} />
</div>
