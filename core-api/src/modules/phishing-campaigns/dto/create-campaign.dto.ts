import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreatePhishingCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Target domain', example: 'example.com' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({
    description: 'Semicolon-separated recipients: email,first,last,position;...',
    example: 'ali@example.com,Ali,Yilmaz,IT Manager;ayse@example.com,Ayse,Demir,CFO',
  })
  @IsString()
  @IsNotEmpty()
  recipients: string;

  @ApiProperty({
    default: 'password-reset',
    enum: ['password-reset', 'it-helpdesk', 'ceo-urgent', 'mfa-verify', 'custom'],
  })
  @IsOptional()
  @IsIn(['password-reset', 'it-helpdesk', 'ceo-urgent', 'mfa-verify', 'custom'])
  templatePreset?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customSubject?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customHTML?: string;

  @ApiProperty({
    default: 'generic-login',
    enum: ['generic-login', 'o365-login', 'google-login'],
  })
  @IsOptional()
  @IsIn(['generic-login', 'o365-login', 'google-login'])
  landingPreset?: string;

  @ApiProperty({ default: 60, description: 'Campaign duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  durationMinutes?: number;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  captureCredentials?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  capturePasswords?: boolean;

  @ApiProperty({ required: false, description: 'Redirect URL after credential capture' })
  @IsOptional()
  @IsString()
  redirectURL?: string;

  @ApiProperty({ required: false, description: 'Tool config profile ID for SMTP settings' })
  @IsOptional()
  @IsUUID()
  configProfileId?: string;
}
