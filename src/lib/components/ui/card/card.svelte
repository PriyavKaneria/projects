<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type $$Props = HTMLAttributes<HTMLDivElement>;

	// randomly select a border image from 1 to 7
	const borderImage = Math.floor(Math.random() * 7) + 1;
	// slice is between 22% and 27%
	const borderSlice = Math.floor(Math.random() * 6) + 22;
	// outset is between 11px and 18px
	const borderOutset = Math.floor(Math.random() * 7) + 11;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<div
	class={cn(`rounded-lg border-2 bg-card text-card-foreground shadow-sm`, className)}
	style={`
		border-image-source: url('/border-image-${borderImage}.png');
		border-image-slice: ${borderSlice}%;
		border-image-width: 25px;
		border-image-outset: ${borderOutset}px;
	`}
	{...$$restProps}
>
	<slot />
</div>

<style>
	.border-custom {
		border: 2px groove black; /* Fallback */
		border-image-slice: 22%;
		border-image-width: 25px;
		border-image-outset: 18px;
	}

	.border-xkcd {
		border-image: url('/border-image-0.png');
		border-image-slice: 13% 7%;
		border-image-width: 30px;
	}
</style>
