import LocAnalysisJson from './loc_analysis.json';
import reposJson from './repos.json';

interface LocAnalysis {
	total_files: number;
	total_lines: number;
	total_blanks: number;
	total_comments: number;
	total_lines_of_code: number;
	boilerplate_lines: number;
	actual_code_lines: number;
	language_distribution: Record<string, number>;
	description?: string | null;
	stars?: number;
	topics?: string[];
	private?: boolean;
	contributions?: {
		total_commits: number;
		total_lines_changed: {
			additions: number;
			deletions: number;
		};
		first_commit_date: string | null;
		last_commit_date: string | null;
		median_commit_size: number;
	};
}

interface Repo {
	source: string;
	path: string;
	ignore: string[];
	contributor?: boolean;
}

export interface Project {
	title: string;
	description?: string | null;
	link: string;
	stars?: number;
	languages: string[];
	topics?: string[];
	loc: number;
	first_commit_date?: string | null;
	private?: boolean;
}

const locAnalysis = LocAnalysisJson as Record<string, LocAnalysis>;
const repos = reposJson as Repo[];

// array of titles, desc and links
export const projects: Project[] = Object.keys(locAnalysis).map((key) => {
	const {
		description,
		stars,
		language_distribution,
		topics,
		total_lines_of_code,
		contributions,
		private: isPrivate
	} = locAnalysis[key];
	const repo = repos.find((r) => r.path.includes(key));
	// get keys of language_distribution in descending sorted order
	const sorted_languages = Object.fromEntries(
		Object.entries(language_distribution).sort(([, a], [, b]) => b - a)
	);
	const languages = Object.keys(sorted_languages).map((lang) =>
		lang.toLowerCase().replace('.', '')
	);
	return {
		title: key,
		description,
		link: `https://${repo?.source}.com/${repo?.path}`,
		stars,
		languages,
		topics,
		loc: total_lines_of_code,
		first_commit_date: contributions?.first_commit_date,
		private: isPrivate
	};
});

// Code for generating project plotting data

export interface ScatterPlotData {
	x: number;
	y: number;
	size?: number;
}

export interface BarPlotData {
	x: string;
	y: number;
}

export interface LinePlotData {
	x: string;
	y: number;
}

export interface PiePlotData {
	label: string;
	value: number;
}

export interface LorentzPlotData {
	x: number;
	y: number;
	z: number;
}

export interface HeatmapPlotData {
	x: string;
	y: string;
	z: number;
}

export interface DensityPlotData {
	x: number;
	y: number;
}

export interface PolarPlotData {
	x: number;
}

export type PlotDataType =
	| ScatterPlotData
	| BarPlotData
	| LinePlotData
	| PiePlotData
	| LorentzPlotData
	| DensityPlotData
	| HeatmapPlotData
	| PolarPlotData;

type ProjectPlottingData = Record<
	string, // project name
	Record<
		string, // plot title
		{
			plotType: string; // plot type
			value: PlotDataType[]; // plot data
		}
	>
>;

interface PlotGenerator {
	key: string;
	type: string;
	generate?: (locData: LocAnalysis) => PlotDataType[];
	xLabel?: string;
	yLabel?: string;
	zLabel?: string;
	IQRFactor?: number;
	globalGenerator?: (locAnalysis: Record<string, LocAnalysis>) => PlotDataType[];
	plotInfo?: {
		display: string;
		description: string;
	};
}

const plotGenerators: PlotGenerator[] = [
	{
		key: 'Commit Momentum',
		type: 'scatter',
		generate: (locData) => [
			{
				x:
					(locData.contributions?.median_commit_size || 0) < 500
						? locData.contributions?.median_commit_size || 0
						: 0,
				y: locData.contributions?.total_commits || 0
			}
		],
		xLabel: 'Median Commit Size',
		yLabel: 'Total Commits',
		IQRFactor: 5
	},
	{
		key: 'Commit Butterfly Effect',
		type: 'lorentz',
		generate: (locData) => [
			{
				// commits
				x: locData.contributions?.total_commits || 0,
				// code churn
				y:
					(locData.contributions?.total_lines_changed.deletions || 0) /
					(locData.total_lines_of_code || 1),
				// comment ratio
				z: (locData.total_comments / locData.total_lines_of_code) * 100 // percentage
			}
		],
		xLabel: 'Commits',
		yLabel: 'Code Churn',
		zLabel: 'Comment Ratio',
		plotInfo: {
			display: 'Lorentz Attractor',
			description:
				'The Lorentz Attractor is a set of chaotic solutions to a system of ordinary differential equations.'
		}
	},
	{
		key: 'Language Polyglot Index',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.total_files,
				y: Object.keys(locData.language_distribution).length
			}
		],
		xLabel: 'Total Files',
		yLabel: 'Number of Languages',
		IQRFactor: 25
	},
	{
		key: 'Language concentration',
		type: 'heatmap',
		globalGenerator: (locAnalysis) => {
			const projectData: PlotDataType[] = [];
			for (const projectName in locAnalysis) {
				const locData = locAnalysis[projectName];
				for (const fileType in locData.language_distribution) {
					projectData.push({
						x: fileType.replace('.', '').slice(0, 4),
						y: projectName,
						z: locData.language_distribution[fileType]
					});
				}
			}
			return projectData;
		},
		xLabel: 'language',
		yLabel: 'project',
		IQRFactor: 1.5,
		plotInfo: {
			display: 'Heatmap',
			description: 'Concentration of code in different languages across projects.'
		}
	},
	{
		key: 'Commit Time Warp',
		type: 'density',
		generate: (locData) => {
			const firstCommit = new Date(locData.contributions?.first_commit_date || '');
			const lastCommit = new Date(locData.contributions?.last_commit_date || '');
			const projectAge = (lastCommit.getTime() - firstCommit.getTime()) / (1000 * 60 * 60 * 24); // in days
			return [
				{
					x: projectAge,
					y: locData.contributions?.total_commits || 0
				}
			];
		},
		xLabel: 'Project Age (days)',
		yLabel: 'Total Commits',
		IQRFactor: 2,
		plotInfo: {
			display: 'Density Plot using Hexbins',
			description: 'Extra data points were calculated for density spread viz'
		}
	},
	{
		key: 'Motivation curve',
		type: 'bar',
		globalGenerator: (locAnalysis) => {
			// number of projects for n weeks since first commit
			const projectAgeCounts: Record<number, number> = {};
			for (const key in locAnalysis) {
				const locData = locAnalysis[key];
				const firstCommit = new Date(locData.contributions?.first_commit_date || '');
				const lastCommit = new Date(locData.contributions?.last_commit_date || '');
				const projectAge = (lastCommit.getTime() - firstCommit.getTime()) / (1000 * 60 * 60 * 24); // in days
				const weeks = Math.floor(projectAge / 7);
				projectAgeCounts[weeks] = (projectAgeCounts[weeks] || 0) + 1;
			}

			return Object.entries(projectAgeCounts).map(([weeks, count]) => ({
				x: weeks,
				y: count
			}));
		},
		xLabel: 'Language',
		yLabel: 'Percentage of Code'
	},
	{
		key: 'Language Loyalty Chart',
		type: 'bar',
		generate: (locData) => {
			return Object.entries(locData.language_distribution).map(([language, lines]) => ({
				x: language,
				y: (lines / locData.total_lines_of_code) * 100 // percentage
			}));
		},
		xLabel: 'Language',
		yLabel: 'Percentage of Code'
	},
	{
		key: 'Star Constellation',
		type: 'polar',
		generate: (locData) => [
			{
				x: locData.stars || 0
			}
		],
		xLabel: 'Total Lines of Code',
		yLabel: 'Stars'
	},
	{
		key: 'Topic Galaxy',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.topics?.length || 0,
				y: locData.total_files
			}
		],
		xLabel: 'Number of Topics',
		yLabel: 'Total Files'
	},
	{
		key: 'Comment Density',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.total_lines_of_code,
				y: (locData.total_comments / locData.total_lines_of_code) * 100 // percentage
			}
		],
		xLabel: 'Total Lines of Code',
		yLabel: 'Comment Density (%)'
	},
	{
		key: 'Project Privacy vs Size',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.total_lines_of_code,
				y: locData.private ? 1 : 0 // 1 for private, 0 for public
			}
		],
		xLabel: 'Total Lines of Code',
		yLabel: 'Private Repository'
	},
	{
		key: 'Commit Size Distribution',
		type: 'bar',
		generate: (locData) => {
			const medianSize = locData.contributions?.median_commit_size || 0;
			return [
				{ x: 'Small', y: medianSize < 10 ? 1 : 0 },
				{ x: 'Medium', y: medianSize >= 10 && medianSize < 100 ? 1 : 0 },
				{ x: 'Large', y: medianSize >= 100 ? 1 : 0 }
			];
		},
		xLabel: 'Commit Size',
		yLabel: 'Number of Commits'
	},
	{
		key: 'Language Diversity',
		type: 'pie',
		generate: (locData) => {
			return Object.entries(locData.language_distribution).map(([language, lines]) => ({
				label: language,
				value: lines
			}));
		},
		xLabel: 'Language',
		yLabel: 'Lines of Code'
	}
];

const plotGeneratorKeys = plotGenerators.map((generator) => generator.key);
plotGeneratorKeys.unshift('Timeline');
export const plotNames = plotGeneratorKeys;
export const plotMetadata = Object.fromEntries(
	plotGenerators.map((generator) => [
		generator.key,
		{
			type: generator.type,
			xLabel: generator.xLabel,
			yLabel: generator.yLabel,
			zLabel: generator.zLabel,
			IQRFactor: generator.IQRFactor,
			plotInfo: generator.plotInfo
		}
	])
);

function generateProjectPlottingData(
	locAnalysis: Record<string, LocAnalysis>,
	repos: Repo[]
): ProjectPlottingData {
	const result: ProjectPlottingData = {};

	for (const repo of repos) {
		const projectName = repo.path.split('/')[1];
		const locData = locAnalysis[projectName];

		if (locData) {
			result[projectName] = Object.fromEntries(
				plotGenerators.map((generator) => [
					generator.key,
					{
						plotType: generator.type,
						value: generator.globalGenerator
							? generator.globalGenerator(locAnalysis)
							: generator.generate
								? generator.generate(locData)
								: []
					}
				])
			);
		}
	}

	return result;
}

export const projectPlottingData = generateProjectPlottingData(locAnalysis, repos);
