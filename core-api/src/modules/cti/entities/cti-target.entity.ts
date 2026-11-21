import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';

@Entity('cti_targets')
@Index('IDX_cti_targets_workspace', ['workspaceId'])
@Index('IDX_cti_targets_workspace_type', ['workspaceId', 'type'])
export class CtiTarget extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ApiProperty({ description: 'Target value (domain, email, IP, etc.)' })
  @Column()
  value: string;

  @ApiProperty({ description: 'Target type (DOMAIN, EMAIL, IP, etc.)' })
  @Column()
  type: string;

  @ApiProperty({ nullable: true, description: 'Human-friendly display name' })
  @Column({ nullable: true })
  label: string;

  @ApiProperty({ default: 'MANUAL' })
  @Column({ default: 'MANUAL' })
  source: string;

  @ApiProperty({ default: 'disabled' })
  @Column({ default: 'disabled' })
  scanSchedule: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  lastScanAt: Date;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isEnabled: boolean;

  @ApiProperty({ default: {} })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
