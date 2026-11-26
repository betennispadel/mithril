import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { CtiTarget } from './cti-target.entity';

@Entity('cti_assets')
@Index('IDX_cti_assets_workspace', ['workspaceId'])
@Index('IDX_cti_assets_target', ['ctiTargetId'])
@Index('IDX_cti_assets_workspace_type', ['workspaceId', 'type'])
export class CtiAsset extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  ctiTargetId: string;

  @ManyToOne(() => CtiTarget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ctiTargetId' })
  ctiTarget: CtiTarget;

  @ApiProperty({ description: 'Asset value' })
  @Column()
  value: string;

  @ApiProperty({ description: 'Asset type' })
  @Column()
  type: string;

  @ApiProperty({ default: 0, description: 'Confidence score 0.0-1.0' })
  @Column({ type: 'float', default: 0 })
  confidence: number;

  @ApiProperty({ default: 0, description: 'Threat score 0-100' })
  @Column({ type: 'int', default: 0 })
  threatScore: number;

  @ApiProperty({ nullable: true, description: 'Source feed/engine' })
  @Column({ nullable: true })
  source: string;

  @ApiProperty()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  firstSeenAt: Date;

  @ApiProperty()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  lastSeenAt: Date;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ nullable: true, description: 'STIX 2.1 SDO type mapping' })
  @Column({ nullable: true })
  stixType: string;

  @ApiProperty({ nullable: true, description: 'Canonical/normalized value' })
  @Column({ nullable: true })
  canonicalValue: string;

  @ApiProperty({ nullable: true, description: 'Context snippet from source' })
  @Column({ type: 'text', nullable: true })
  contextSnippet: string;

  @ApiProperty({ nullable: true, description: 'How the entity was extracted' })
  @Column({ nullable: true })
  extractionMethod: string;

  @ApiProperty({ default: 0, description: 'Number of independent sources' })
  @Column({ type: 'int', default: 0 })
  sourceCount: number;

  @ApiProperty({ default: false, description: 'High signal indicator' })
  @Column({ default: false })
  highSignal: boolean;

  @ApiProperty({ default: false, description: 'Cross-referenced across investigations' })
  @Column({ default: false })
  crossReferenced: boolean;

  @ApiProperty({ nullable: true, description: 'Freshness tag: fresh, recent, stale' })
  @Column({ nullable: true })
  freshnessTag: string;

  @ApiProperty({ default: 0, description: 'Priority score 0-100' })
  @Column({ type: 'float', default: 0 })
  priorityScore: number;

  @ApiProperty({ nullable: true, description: 'Graph community cluster ID' })
  @Column({ type: 'int', nullable: true })
  communityId: number;

  @ApiProperty({ default: {}, description: 'Enrichment data from VT, AbuseIPDB, etc' })
  @Column({ type: 'jsonb', default: '{}' })
  enrichmentData: Record<string, any>;

  @ApiProperty({ default: {} })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
