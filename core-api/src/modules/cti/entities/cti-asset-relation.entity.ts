import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { CtiAsset } from './cti-asset.entity';

@Entity('cti_asset_relations')
@Index('IDX_cti_asset_relations_source', ['sourceAssetId'])
@Index('IDX_cti_asset_relations_target', ['targetAssetId'])
export class CtiAssetRelation extends BaseEntity {
  @ApiProperty()
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  sourceAssetId: string;

  @ManyToOne(() => CtiAsset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceAssetId' })
  sourceAsset: CtiAsset;

  @ApiProperty()
  @Column({ type: 'uuid' })
  targetAssetId: string;

  @ManyToOne(() => CtiAsset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetAssetId' })
  targetAsset: CtiAsset;

  @ApiProperty({ description: 'Relation type (uses, communicates-with, attributed-to, etc.)' })
  @Column()
  relationType: string;

  @ApiProperty({ default: 0 })
  @Column({ type: 'float', default: 0 })
  confidence: number;

  @ApiProperty({ nullable: true })
  @Column({ nullable: true })
  source: string;

  @ApiProperty({ default: {} })
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
