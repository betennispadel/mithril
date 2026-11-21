import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class GetPhishingCampaignsDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @ApiProperty({ required: false, enum: ['draft', 'running', 'completed', 'failed'] })
  @IsOptional()
  @IsIn(['draft', 'running', 'completed', 'failed'])
  status?: string;
}
