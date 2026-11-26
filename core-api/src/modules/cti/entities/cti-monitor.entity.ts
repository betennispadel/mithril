import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity, Index, OneToMany, Relation } from 'typeorm';
import { CtiMonitorAlert } from './cti-monitor-alert.entity';

@Entity('cti_monitors')
@Index('IDX_cti_monitor_workspace', ['workspaceId'])
export class CtiMonitor extends BaseEntity {
  @Column('text')
  name: string;

  @Column('text')
  query: string;

  @Column('text', { default: 'daily' })
  interval: string; // hourly | daily | weekly

  @Column('uuid')
  workspaceId: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('jsonb', { default: '{}' })
  deliveryChannels: Record<string, any>; // {slack: true, telegram: true, webhook: 'url'}

  @Column('jsonb', { default: '{}' })
  lastSnapshot: Record<string, any>;

  @Column('timestamptz', { nullable: true })
  lastRunAt: Date;

  @Column('int', { default: 0 })
  alertCount: number;

  @OneToMany(() => CtiMonitorAlert, (alert) => alert.monitor, { cascade: true })
  alerts: Relation<CtiMonitorAlert[]>;
}
