import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { CtiMonitor } from './cti-monitor.entity';

@Entity('cti_monitor_alerts')
@Index('IDX_cti_monitor_alert_monitor', ['monitorId'])
export class CtiMonitorAlert extends BaseEntity {
  @Column('uuid')
  monitorId: string;

  @ManyToOne(() => CtiMonitor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'monitorId' })
  monitor: Relation<CtiMonitor>;

  @Column('uuid')
  workspaceId: string;

  @Column('text', { default: 'new_entities' })
  changeType: string;

  @Column('text', { nullable: true })
  summary: string;

  @Column('jsonb', { default: '{}' })
  diffData: Record<string, any>;

  @Column('int', { default: 0 })
  entityCountDelta: number;

  @Column('boolean', { default: false })
  delivered: boolean;

  @Column('text', { default: 'info' })
  severity: string; // info | warning | critical
}
