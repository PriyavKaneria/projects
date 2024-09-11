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
	// size?: number;
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

export interface HeatmapPlotData {
	x: string;
	y: string;
	z: number;
}

export type PlotDataType =
	| ScatterPlotData
	| BarPlotData
	| LinePlotData
	| PiePlotData
	| HeatmapPlotData;

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
	generate: (locData: LocAnalysis) => PlotDataType[];
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
		]
	},
	{
		key: 'Language Polyglot Index',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.total_files,
				y: Object.keys(locData.language_distribution).length
			}
		]
	},
	{
		key: 'Code Verbosity Spectrum',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.total_lines_of_code,
				y: locData.total_comments
			}
		]
	},
	{
		key: 'Project Lifecycle Heatmap',
		type: 'heatmap',
		generate: (locData) => [
			{
				x: locData.contributions?.first_commit_date || '',
				y: locData.contributions?.last_commit_date || '',
				z: locData.total_lines_of_code
			}
		]
	},
	{
		key: 'Blank Space Odyssey',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.total_lines,
				y: locData.total_blanks
			}
		]
	},
	{
		key: 'Commit Time Warp',
		type: 'scatter',
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
		}
	},
	{
		key: 'Language Loyalty Chart',
		type: 'bar',
		generate: (locData) => {
			return Object.entries(locData.language_distribution).map(([language, lines]) => ({
				x: language,
				y: (lines / locData.total_lines_of_code) * 100 // percentage
			}));
		}
	},
	{
		key: 'Code Churn Tornado',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.contributions?.total_lines_changed.additions || 0,
				y: locData.contributions?.total_lines_changed.deletions || 0
			}
		]
	},
	{
		key: 'Star Constellation',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.total_lines_of_code,
				y: locData.stars || 0
			}
		]
	},
	{
		key: 'Topic Galaxy',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.topics?.length || 0,
				y: locData.total_files
			}
		]
	},
	{
		key: 'Comment Density',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.total_lines_of_code,
				y: (locData.total_comments / locData.total_lines_of_code) * 100 // percentage
			}
		]
	},
	{
		key: 'Project Privacy vs Size',
		type: 'scatter',
		generate: (locData) => [
			{
				x: locData.total_lines_of_code,
				y: locData.private ? 1 : 0 // 1 for private, 0 for public
			}
		]
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
		}
	},
	{
		key: 'Language Diversity',
		type: 'pie',
		generate: (locData) => {
			return Object.entries(locData.language_distribution).map(([language, lines]) => ({
				label: language,
				value: lines
			}));
		}
	}
];

export const plotNames = plotGenerators.map((generator) => generator.key);
export const plotTypes = Object.fromEntries(
	plotGenerators.map((generator) => [generator.key, generator.type])
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
						value: generator.generate(locData)
					}
				])
			);
		}
	}

	return result;
}

export const projectPlottingData = generateProjectPlottingData(locAnalysis, repos);