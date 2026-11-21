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

  @ApiProperty({ default: {} })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
