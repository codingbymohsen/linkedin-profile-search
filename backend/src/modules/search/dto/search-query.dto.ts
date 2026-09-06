import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description:
			'Free-text search across name, title, skills, summary, and company.',
	})
	q?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ example: 'information technology and services' })
	industry?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ description: 'Exact or partial job title filter.' })
	job_title?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ description: 'Skill keyword filter.' })
	skills?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ example: 'garver' })
	job_company_name?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ example: '51-200' })
	job_company_size?: string;

	@IsOptional()
	@Type(() => Number)
	@Min(0)
	@ApiPropertyOptional({ minimum: 0 })
	min_years?: number;

	@IsOptional()
	@Type(() => Number)
	@Min(0)
	@ApiPropertyOptional({ minimum: 0 })
	max_years?: number;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ example: 'seattle, washington, united states' })
	location_name?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@ApiPropertyOptional({ default: 1, minimum: 1 })
	page = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(500)
	@ApiPropertyOptional({ default: 500, minimum: 1, maximum: 500 })
	limit = 20;
}
