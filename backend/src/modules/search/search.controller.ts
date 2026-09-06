import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { FiltersResponseDto } from './dto/filters-response.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { SearchService } from './search.service';
import {
	ApiOperation,
	ApiProduces,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';

@Controller('profiles')
@ApiTags('Profiles')
export class SearchController {
	constructor(private readonly searchService: SearchService) {}

	// Search profiles using Elasticsearch relevance and exact filters.
	@Get('search')
	@ApiOperation({ summary: 'Search profiles' })
	@ApiResponse({
		status: 200,
		description: 'Paginated profile results.',
		type: SearchResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Invalid query parameters.' })
	search(@Query() query: SearchQueryDto): Promise<SearchResponseDto> {
		return this.searchService.search(query);
	}

	// Return aggregation values used to populate filter controls.
	@Get('filters')
	@ApiOperation({ summary: 'Get available filter values' })
	@ApiResponse({
		status: 200,
		description: 'Available aggregation values.',
		type: FiltersResponseDto,
	})
	filters(): Promise<FiltersResponseDto> {
		return this.searchService.filters();
	}

	// Export the current result set as an Excel workbook.
	@Get('export')
	@ApiOperation({ summary: 'Export filtered profiles as Excel' })
	@ApiProduces(
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	)
	@ApiResponse({
		status: 200,
		description: 'Excel workbook containing the filtered public profiles.',
	})
	@ApiResponse({ status: 400, description: 'Invalid query parameters.' })
	async export(
		@Query() query: SearchQueryDto,
		@Res() response: Response,
	): Promise<void> {
		const file = await this.searchService.export(query);
		response.set({
			'Content-Type':
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename=profiles.xlsx',
		});
		response.send(file);
	}
}
