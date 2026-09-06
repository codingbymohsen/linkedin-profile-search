import { ProfileResponseDto } from './profile-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SearchResponseDto {
	total!: number;
	@ApiProperty()
	page!: number;
	@ApiProperty()
	limit!: number;
	@ApiProperty({ type: [ProfileResponseDto] })
	results!: ProfileResponseDto[];
}
