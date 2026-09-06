'use client';

import { useEffect, useState } from 'react';
import Filter from '../components/Filter';
import ProfileCard from '../components/ProfileCard';
import ProfileDetails from '../components/ProfileDetails';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
const EMPTY_FILTERS = {
	industry: '',
	location: '',
	experience: '',
	company: '',
};

const EXPERIENCE_RANGES: Record<string, { min_years?: string; max_years?: string }> = {
	'0 - 2 years': { min_years: '0', max_years: '2' },
	'3 - 7 years': { min_years: '3', max_years: '7' },
	'8 - 15 years': { min_years: '8', max_years: '15' },
	'15+ years': { min_years: '15' },
};

interface FilterOptionsResponse {
	industry?: unknown;
	location_name?: unknown;
	job_company_size?: unknown;
}

// Keep API access in the page coordinator; presentational components remain reusable.
export default function Home() {
	const [query, setQuery] = useState('');
	const [filters, setFilters] = useState(EMPTY_FILTERS);
	const [options, setOptions] = useState({ industry: [], location_name: [], job_company_size: [] });
	const [data, setData] = useState({ total: 0, results: [] });
	const [selected, setSelected] = useState(null);
	const [loading, setLoading] = useState(false);

	const updateFilter = (key, value) =>
		setFilters((current) => ({ ...current, [key]: value }));

	async function search() {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				q: query,
				industry: filters.industry,
				location_name: filters.location,
				job_company_size: filters.company,
				...EXPERIENCE_RANGES[filters.experience],
				limit: '500',
			});
			const response = await fetch(`${API}/profiles/search?${params}`);
			if (!response.ok) throw new Error('Search API failed');
			const body = await response.json();
			setData({
				total: Number(body.total) || 0,
				results: Array.isArray(body.results) ? body.results : [],
			});
		} catch {
			// Keep the page usable when the API is starting or temporarily unavailable.
			setData({ total: 0, results: [] });
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetch(`${API}/profiles/filters`)
			.then((response) => (response.ok ? response.json() : {}))
		.then((body: FilterOptionsResponse) =>
				setOptions({
					industry: Array.isArray(body.industry) ? body.industry : [],
					location_name: Array.isArray(body.location_name)
						? body.location_name
						: [],
					job_company_size: Array.isArray(body.job_company_size)
						? body.job_company_size
						: [],
				}),
			)
			.catch(() => undefined);
		search();
	}, []);

	function exportFile() {
		window.location.href = `${API}/profiles/export?${new URLSearchParams({
			q: query,
			industry: filters.industry,
			location_name: filters.location,
			job_company_size: filters.company,
			...EXPERIENCE_RANGES[filters.experience],
		})}`;
	}

	return (
		<main>
			<header>
				<div className="brand">
					Talent Discovery{' '}
					<nav>
						<a className="active">Search</a>
					</nav>
				</div>
				<div className="account">
					?　 <b>AM</b> Alex Morgan⌄
				</div>
			</header>
			<div className="heading">
				<div>
					<h1>Find the right people, faster.</h1>
					<p>Search across your candidate dataset with precision.</p>
				</div>
				<button className="primary export" onClick={exportFile}>
					⇩　Export Excel
				</button>
			</div>
			<section className="searchbar">
				<span>⌕</span>
				<input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					onKeyDown={(event) => event.key === 'Enter' && search()}
					placeholder="Search by name, job title, skill, company..."
				/>
				<button className="primary search-button" onClick={search}>Search</button>
			</section>
			<div className="chips">
				{Object.entries(filters)
					.filter(([, value]) => value)
					.map(([key, value]) => (
						<button key={key} onClick={() => updateFilter(key, '')}>
							{key}: {value} ×
						</button>
					))}
				{Object.values(filters).some(Boolean) && (
					<button onClick={() => setFilters(EMPTY_FILTERS)}>Clear all</button>
				)}
			</div>
			<section className="layout">
				<aside className="filters">
					<div className="filterhead">
						<h2>Filters</h2>
						<button onClick={() => setFilters(EMPTY_FILTERS)}>Reset all</button>
					</div>
					<Filter
						label="Industry"
						value={filters.industry}
						onChange={(value) => updateFilter('industry', value)}
						options={options.industry}
					/>
					<Filter
						label="Location"
						value={filters.location}
						onChange={(value) => updateFilter('location', value)}
						options={options.location_name}
					/>
					<Filter
						label="Years of experience"
						value={filters.experience}
						onChange={(value) => updateFilter('experience', value)}
						options={[
							'0 - 2 years',
							'3 - 7 years',
							'8 - 15 years',
							'15+ years',
						]}
					/>
					<Filter
						label="Company size"
						value={filters.company}
						onChange={(value) => updateFilter('company', value)}
						options={options.job_company_size}
					/>
					<button className="primary apply" onClick={search}>
						Apply filters
					</button>
				</aside>
				<div className="results">
					<div className="toolbar">
						<strong>{data.total} profiles</strong>
					</div>
					{loading ? (
						<div className="empty">Searching profiles...</div>
					) : (
						data.results.map((profile, index) => (
							<ProfileCard
								key={`${profile.linkedin_url || profile.full_name}-${index}`}
								profile={profile}
								onOpen={setSelected}
							/>
						))
					)}
					{!loading && !data.results.length && (
						<div className="empty">No matching profiles found.</div>
					)}
				</div>
				<ProfileDetails profile={selected} onClose={() => setSelected(null)} />
			</section>
		</main>
	);
}
