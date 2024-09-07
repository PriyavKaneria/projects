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
