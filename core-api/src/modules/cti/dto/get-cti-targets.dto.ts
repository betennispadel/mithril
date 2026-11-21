import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CtiTargetType } from '../enums/cti-types.enum';

export class GetCtiTargetsDto {
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

  @ApiProperty({ required: false, enum: CtiTargetType })
  @IsOptional()
  @IsEnum(CtiTargetType)
  type?: CtiTargetType;
}
