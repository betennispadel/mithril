import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { CtiTarget } from './cti-target.entity';

@Entity('cti_investigations')
@Index('IDX_cti_investigations_workspace', ['workspaceId'])
export class CtiInvestigation extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  ctiTargetId: string;

  @ManyToOne(() => CtiTarget, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ctiTargetId' })
  ctiTarget: CtiTarget;

  @ApiProperty({ description: 'Investigation query' })
  @Column()
  query: string;

  @ApiProperty({ default: 'pending' })
  @Column({ default: 'pending' })
  status: string;

  @ApiProperty({ default: 0 })
  @Column({ type: 'int', default: 0 })
  entityCount: number;

  @ApiProperty({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  jobId: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @ApiProperty({ nullable: true, description: 'LLM-refined query' })
  @Column({ nullable: true })
  refinedQuery: string;

  @ApiProperty({ nullable: true, description: 'AI-generated summary' })
  @Column({ type: 'text', nullable: true })
  summary: string;

  @ApiProperty({ nullable: true, description: 'LLM model used' })
  @Column({ nullable: true })
  modelUsed: string;

  @ApiProperty({ default: {}, description: 'Sources used and their status' })
  @Column({ type: 'jsonb', default: '{}' })
  sourcesUsed: Record<string, any>;

  @ApiProperty({ default: 0, description: 'Number of pages scraped' })
  @Column({ type: 'int', default: 0 })
  pageCount: number;

  @ApiProperty({ default: 'pending', description: 'Graph construction status' })
  @Column({ default: 'pending' })
  graphStatus: string;

  @ApiProperty({ default: {}, description: 'Community detection results' })
  @Column({ type: 'jsonb', default: '{}' })
  communities: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  graphData: Record<string, any>;

  @ApiProperty({ default: 0, description: 'Current pipeline step' })
  @Column({ type: 'int', default: 0 })
  currentStep: number;

  @ApiProperty({ nullable: true, description: 'Current pipeline step label' })
  @Column({ nullable: true })
  currentStepLabel: string;

  @ApiProperty({ default: 10, description: 'Total pipeline steps' })
  @Column({ type: 'int', default: 10 })
  totalSteps: number;

  @ApiProperty({ default: 0, description: 'Number of relationships found' })
  @Column({ type: 'int', default: 0 })
  relationshipCount: number;

  @ApiProperty({ default: {} })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
