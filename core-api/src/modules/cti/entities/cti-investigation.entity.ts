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

  @ApiProperty({ default: {} })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
