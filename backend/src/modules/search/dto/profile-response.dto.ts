import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
	@ApiPropertyOptional()
	full_name?: string;
	@ApiPropertyOptional()
	job_title?: string;
	job_title_role?: string;
	job_title_levels?: string;
	job_company_name?: string;
	job_company_industry?: string;
	job_company_size?: string;
	job_company_founded?: string;
	industry?: string;
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
