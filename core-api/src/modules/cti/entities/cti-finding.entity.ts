import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { CtiTarget } from './cti-target.entity';
import { Tool } from '@/modules/tools/entities/tools.entity';
import { JobHistory } from '@/modules/jobs-registry/entities/job-history.entity';

/**
 * CTI Finding — the Threat Intelligence counterpart of Vulnerability.
 * Linked to a CtiTarget instead of an ASM Asset. Stores threat intel
 * findings from Pensieve (dark web mentions, leaked credentials,
 * brand threats, IOC matches, etc.).
 */
@Entity('cti_findings')
@Unique(['fingerprint'])
@Index('IDX_cti_findings_workspace', ['workspaceId'])
@Index('IDX_cti_findings_target', ['ctiTargetId'])
@Index('IDX_cti_findings_workspace_severity', ['workspaceId', 'severity'])
@Index('IDX_cti_findings_workspace_category', ['workspaceId', 'category'])
@Index('IDX_cti_findings_createdAt', ['createdAt'])
export class CtiFinding extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  ctiTargetId: string;

  @ManyToOne(() => CtiTarget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ctiTargetId' })
  ctiTarget: CtiTarget;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ default: 'info' })
  @Column({ type: 'varchar', default: 'info' })
  severity: string;

  @ApiProperty({ description: 'Finding category: darkweb, data-leak, brand-protection, ioc, fraud, sanctions, social, crypto' })
  @Column({ type: 'varchar', nullable: true })
  category: string;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  matchedAt: string;

  @ApiProperty()
  @Column('text', { array: true, nullable: true })
  tags: string[];

  @ApiProperty()
  @Column('text', { array: true, nullable: true })
  references: string[];

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  source: string;

  @ApiProperty()
  @Column({ unique: true })
  fingerprint: string;

  @ManyToOne(() => Tool, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'toolId' })
  tool: Tool;

  @ApiProperty()
  @Column({ type: 'uuid', nullable: true })
  toolId: string;

  @ManyToOne(() => JobHistory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'jobHistoryId' })
  jobHistory: JobHistory;

  @ApiProperty()
  @Column({ type: 'uuid', nullable: true })
  jobHistoryId: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'float', nullable: true })
  confidence: number;

  @ApiProperty({ nullable: true })
  @Column({ type: 'int', nullable: true })
  threatScore: number;

  @ApiProperty()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  firstSeenAt: Date;

  @ApiProperty()
  @Column({ type: 'timestamptz', default: () => 'now()' })
  lastSeenAt: Date;

  @ApiProperty({ default: 1 })
  @Column({ type: 'int', default: 1 })
  timesDetected: number;

  @ApiProperty({ default: {} })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
