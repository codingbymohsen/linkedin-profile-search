import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { FiltersResponseDto } from './dto/filters-response.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';

type RawProfile = Record<string, string>;
type SearchHit = { _source?: RawProfile };
type SearchResult = { hits: { total: { value: number }; hits: SearchHit[] } };
type Bucket = { key: string | number };
type Aggregation = { buckets: Bucket[] };
type TermsAggregation = { terms: { field: string; size: number } };

@Injectable()
export class SearchService implements OnModuleInit {
	private readonly es: Client;
	private readonly index = 'profiles';
	private readonly dataFilePath: string;

	constructor(private readonly configService: ConfigService) {
		this.es = new Client({
			node: this.configService.get<string>('ELASTICSEARCH_URL', 'http://localhost:9200'),
		});
		this.dataFilePath = this.configService.get<string>(
			'DATA_FILE_PATH',
			'/app/data/linkedin.txt',
		);
	}

	// Rebuild the development index on startup so imports remain deterministic.
	async onModuleInit(): Promise<void> {
		if (await this.es.indices.exists({ index: this.index }))
			await this.es.indices.delete({ index: this.index });
		await this.es.indices.create({
			index: this.index,
			mappings: {
				properties: {
					full_name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
					job_title: { type: 'text' },
					job_company_size: { type: 'keyword' },
					skills: { type: 'text' },
					industry: { type: 'keyword' },
					location_name: { type: 'keyword' },
					job_company_name: { type: 'keyword' },
					inferred_years_experience: { type: 'float' },
				},
			},
		});
		const raw = fs.readFileSync(this.dataFilePath, 'utf8');
		// Tolerate malformed quotes and variable-width rows in the supplied export.
		const rows = csv.parse(raw, {
			columns: true,
			relax_column_count: true,
			relax_quotes: true,
			skip_empty_lines: true,
			skip_records_with_error: true,
		});
		const operations = rows.flatMap((row: RawProfile) => {
			// Ignore malformed source-path rows that are not real profiles.
			if (this.isInvalidSourceRow(row)) return [];
			const profile = this.normalizeProfile(this.mapSourceRow(row));
			return [
				{ index: { _index: this.index } },
				profile,
			];
		});
		// Bulk indexing avoids one network request per profile.
		if (operations.length) {
			const response = await this.es.bulk({ operations, refresh: true });
			if (response.errors) {
				const failedItems = response.items.filter((item) => item.index?.error);
				throw new Error(`Profile import failed for ${failedItems.length} records`);
			}
		}
	}

	async search(query: SearchQueryDto): Promise<SearchResponseDto> {
		const filterFields = [
			'industry', 'job_company_name', 'location_name', 'job_company_size',
		] as const;
		const filters = filterFields
			.filter((field) => Boolean(query[field]))
			.map((field) => ({ term: { [field]: query[field] } }));
		const must = query.q
			? [
					{
						multi_match: {
							query: query.q,
							fields: [
								'full_name^3',
								'job_title^4',
								'skills^3',
								'summary',
								'job_company_name',
							],
							fuzziness: 'AUTO',
						},
					},
				]
			: [{ match_all: {} }];
		if (query.job_title) must.push({ match: { job_title: query.job_title } } as never);
		if (query.skills) must.push({ match: { skills: query.skills } } as never);
		const range: Record<string, number> = {};
		if (query.min_years !== undefined) range.gte = query.min_years;
		if (query.max_years !== undefined) range.lte = query.max_years;
		if (Object.keys(range).length) filters.push({ range: { inferred_years_experience: range } } as never);
		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(500, Number(query.limit) || 500);
		// Sort text fields through their keyword subfield; Elasticsearch disables fielddata on text.
		const result = (await this.es.search({
			index: this.index,
			from: (page - 1) * limit,
			size: limit,
			query: { bool: { must, filter: filters } },
			sort: query.q ? ['_score'] : [{ 'full_name.keyword': 'asc' }],
		})) as unknown as SearchResult;
		return {
			total: result.hits.total.value,
			page,
			limit,
			results: result.hits.hits.map((hit: SearchHit) =>
				this.publicProfile(hit._source ?? {}),
			),
		};
	}

	async filters(): Promise<FiltersResponseDto> {
		const fields = ['industry', 'job_company_name', 'location_name', 'job_company_size'];
		const aggs: Record<string, TermsAggregation> = {};
		fields.forEach((field) => {
			aggs[field] = { terms: { field, size: 100 } };
		});
		const result = (await this.es.search({
			index: this.index,
			size: 0,
			aggs: aggs as unknown as Record<string, object>,
		})) as unknown as { aggregations: Record<string, Aggregation> };
		const values = Object.fromEntries(
			Object.entries(result.aggregations).map(
				([field, aggregation]: [string, Aggregation]) => [
					field,
					aggregation.buckets.map((bucket: Bucket) => String(bucket.key)),
				],
			),
		);
		return {
			industry: values.industry ?? [],
			job_company_name: values.job_company_name ?? [],
			location_name: values.location_name ?? [],
			job_company_size: values.job_company_size ?? [],
		};
	}

	async export(query: SearchQueryDto): Promise<Buffer> {
		const data: SearchResponseDto = await this.search({
			...query,
			page: 1,
			limit: 500,
		});
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Profiles');
		const columns = [
			'Name',
			'Job Title',
			'Company',
			'Industry',
			'Location',
			'Experience',
			'Skills',
			'LinkedIn URL',
		];
		// Keep the export limited to public, useful recruiting fields.
		worksheet.columns = columns.map((header) => ({ header, key: header }));
		data.results.forEach((profile: ProfileResponseDto) =>
			worksheet.addRow(Object.values(profile)),
		);
		return Buffer.from(await workbook.xlsx.writeBuffer());
	}

	// Whitelist response fields so contact and address data never leave the API.
	private publicProfile(profile: RawProfile): ProfileResponseDto {
		const title = profile.job_title || '';
		const name = profile.full_name || '';
		// Reject export artifacts that contain source-file paths instead of profile data.
		if (/^[A-Za-z]:\\|part-\d+\.csv|linkedin-\d{4}/i.test(name)) return {};
		return {
			full_name: profile.full_name,
			job_title: profile.job_title,
			job_title_role: profile.job_title_role,
			job_title_levels: profile.job_title_levels,
			job_company_name: profile.job_company_name,
			job_company_industry: profile.job_company_industry || profile.industry,
			job_company_size: profile.job_company_size,
			job_company_founded: profile.job_company_founded,
			industry: profile.industry,
			location_name: profile.location_name,
			linkedin_connections: profile.linkedin_connections,
			inferred_salary: profile.inferred_salary,
			inferred_years_experience: profile.inferred_years_experience,
			skills: profile.skills,
			interests: profile.interests,
			languages: profile.languages,
			education: profile.education,
			certifications: profile.certifications,
			experience: profile.experience,
			summary: profile.summary,
			linkedin_url: profile.linkedin_url,
		};
	}

	private isInvalidSourceRow(profile: RawProfile): boolean {
		const name = profile.full_name || '';
		return !name.trim() || /^[A-Za-z]:\\|part-\d+\.csv|linkedin-\d{4}/i.test(name);
	}

	// Map only the fields used by search and profile cards; sensitive source fields stay out of Elasticsearch.
	private mapSourceRow(row: RawProfile): RawProfile {
		return {
			full_name: row.full_name || '',
			job_title: row.job_title || '',
			job_title_role: row.job_title_role || '',
			job_title_levels: row.job_title_levels || '',
			job_company_name: row.job_company_name || '',
			job_company_industry: row.job_company_industry || '',
			job_company_size: row.job_company_size || '',
			job_company_founded: row.job_company_founded || '',
			industry: row.industry || '',
			location_name: row.location_name || '',
			linkedin_connections: row.linkedin_connections || '',
			inferred_salary: row.inferred_salary || '',
			inferred_years_experience: row.inferred_years_experience || '',
			skills: row.skills || '',
			interests: row.interests || '',
			languages: row.languages || '',
			education: row.education || '',
			certifications: row.certifications || '',
			experience: row.experience || '',
			summary: row.summary || '',
			linkedin_url: row.linkedin_url || '',
		};
	}

	// Normalize values that have strict Elasticsearch mappings so one bad cell cannot drop a whole record.
	private normalizeProfile(profile: RawProfile): RawProfile {
		const normalized = { ...profile };
		const years = Number(normalized.inferred_years_experience);
		if (normalized.inferred_years_experience && Number.isFinite(years) && years >= 0 && years <= 100) {
			normalized.inferred_years_experience = String(years);
		} else {
			delete normalized.inferred_years_experience;
		}
		const connections = Number(normalized.linkedin_connections);
		if (normalized.linkedin_connections && Number.isFinite(connections) && connections >= 0) {
			normalized.linkedin_connections = String(connections);
		} else {
			delete normalized.linkedin_connections;
		}
		for (const field of ['industry', 'location_name', 'job_company_size']) {
			if (this.isInvalidCategoricalValue(normalized[field])) delete normalized[field];
		}
		return normalized;
	}

	private isInvalidCategoricalValue(value: string | undefined): boolean {
		if (!value?.trim()) return false;
		return /^\s*[\[{]/.test(value) || /@|\+?\d[\d\s().-]{6,}/.test(value) || /^\d{4}([/-]\d{1,2})?/.test(value);
	}
}
