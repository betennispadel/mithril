import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CtiTargetType } from '../enums/cti-types.enum';

export class CreateCtiTargetDto {
  @ApiProperty({ description: 'Target value (domain, email, IP, etc.)', example: 'example.com' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ enum: CtiTargetType, description: 'Target type' })
  @IsEnum(CtiTargetType)
  type: CtiTargetType;

  @ApiProperty({ required: false, description: 'Human-friendly label' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ required: false, default: 'disabled', description: 'Scan schedule (cron)' })
  @IsOptional()
  @IsString()
  scanSchedule?: string;
}

export class CreateCtiTargetsBulkDto {
  @ApiProperty({ type: [CreateCtiTargetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCtiTargetDto)
  targets: CreateCtiTargetDto[];
}
