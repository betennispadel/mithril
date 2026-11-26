import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('cti_actor_profiles')
@Index('IDX_cti_actor_workspace', ['workspaceId'])
export class CtiActorProfile extends BaseEntity {
  @Column('text')
  @Index('IDX_cti_actor_handle')
  handle: string;

  @Column('uuid')
  workspaceId: string;

  @Column('text', { array: true, default: '{}' })
  aliases: string[];

  @Column('jsonb', { default: '{}' })
  styleVector: Record<string, any>;

  @Column('text', { nullable: true })
  summary: string;

  @Column('text', { array: true, default: '{}' })
  notes: string[];

  @Column('jsonb', { default: '{}' })
  associatedEntities: Record<string, any>;

  @Column('jsonb', { default: '{}' })
  activityTimeline: Record<string, any>;

  @Column('float', { default: 0 })
  confidence: number;

  @Column('int', { default: 0 })
  sampleCount: number;

  @Column('timestamptz', { nullable: true })
  firstSeenAt: Date;

  @Column('timestamptz', { nullable: true })
  lastSeenAt: Date;
}
