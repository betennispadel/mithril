import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { CtiInvestigation } from './cti-investigation.entity';

@Entity('cti_pages')
@Index('IDX_cti_pages_investigation', ['ctiInvestigationId'])
export class CtiPage extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  ctiInvestigationId: string;

  @ManyToOne(() => CtiInvestigation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ctiInvestigationId' })
  ctiInvestigation: CtiInvestigation;

  @ApiProperty({ description: 'Page URL' })
  @Column()
  url: string;

  @ApiProperty({ nullable: true, description: 'Source engine (ahmia, torch, etc)' })
  @Column({ nullable: true })
  source: string;

  @ApiProperty({ nullable: true, description: 'Content hash for dedup' })
  @Column({ nullable: true })
  contentHash: string;

  @ApiProperty({ nullable: true, description: 'Detected language' })
  @Column({ nullable: true })
  language: string;

  @ApiProperty({ default: 0, description: 'Page content size in bytes' })
  @Column({ type: 'int', default: 0 })
  byteSize: number;
}
