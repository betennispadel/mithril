import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

export enum PhishingCampaignStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('phishing_campaigns')
@Index('IDX_phishing_campaigns_workspace', ['workspaceId'])
@Index('IDX_phishing_campaigns_workspace_status', ['workspaceId', 'status'])
export class PhishingCampaign extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Target domain for the phishing simulation' })
  @Column()
  target: string;

  @ApiProperty({ description: 'Semicolon-separated CSV recipients (email,first,last,position)' })
  @Column({ type: 'text' })
  recipients: string;

  @ApiProperty()
  @Column({ type: 'int' })
  recipientCount: number;

  // Template config
  @ApiProperty({ default: 'password-reset' })
  @Column({ default: 'password-reset' })
  templatePreset: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  customSubject: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  customHTML: string;

  @ApiProperty({ default: 'generic-login' })
  @Column({ default: 'generic-login' })
  landingPreset: string;

  // Campaign config
  @ApiProperty({ default: 60 })
  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @ApiProperty({ default: true })
  @Column({ default: true })
  captureCredentials: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  capturePasswords: boolean;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  redirectURL: string;

  // Execution state
  @ApiProperty({ enum: PhishingCampaignStatus })
  @Column({ default: PhishingCampaignStatus.DRAFT })
  status: PhishingCampaignStatus;

  @ApiProperty({ nullable: true, description: 'Linked job ID when campaign is running/completed' })
  @Column({ type: 'uuid', nullable: true })
  jobId: string;

  @ApiProperty({ nullable: true, description: 'Tool config profile ID for SMTP credentials' })
  @Column({ type: 'uuid', nullable: true })
  configProfileId: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  launchedAt: Date;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  // Denormalized stats for fast listing
  @ApiProperty({ default: 0 })
  @Column({ type: 'int', default: 0 })
  emailsSent: number;

  @ApiProperty({ default: 0 })
  @Column({ type: 'int', default: 0 })
  emailsOpened: number;

  @ApiProperty({ default: 0 })
  @Column({ type: 'int', default: 0 })
  linksClicked: number;

  @ApiProperty({ default: 0 })
  @Column({ type: 'int', default: 0 })
  credsSubmitted: number;

  @ApiProperty({ default: 0 })
  @Column({ type: 'int', default: 0 })
  emailsReported: number;
}
