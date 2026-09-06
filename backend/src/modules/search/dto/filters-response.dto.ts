import { ApiProperty } from '@nestjs/swagger';

export class FiltersResponseDto {
	@ApiProperty({ type: [String] })
	industry!: string[];
	@ApiProperty({ type: [String] })
	job_company_name!: string[];
	@ApiProperty({ type: [String] })
	location_name!: string[];
	@ApiProperty({ type: [String] })
	job_company_size!: string[];
}
