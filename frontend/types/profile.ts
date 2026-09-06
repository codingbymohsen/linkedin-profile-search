export interface Profile {
	full_name?: string;
	job_title?: string;
	job_title_levels?: string;
	job_company_name?: string;
	industry?: string;
	job_company_size?: string;
	job_company_founded?: string;
	location_name?: string;
	linkedin_connections?: string;
	inferred_salary?: string;
	inferred_years_experience?: string;
	skills?: string;
	interests?: string;
	languages?: string;
	education?: string;
	certifications?: string;
	experience?: string;
	summary?: string;
	linkedin_url?: string;
}

export interface SearchResponse {
	total: number;
	page: number;
	limit: number;
	results: Profile[];
}
