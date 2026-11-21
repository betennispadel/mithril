import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtiAsset } from './entities/cti-asset.entity';
import { CtiAssetRelation } from './entities/cti-asset-relation.entity';
import { GetCtiAssetsDto } from './dto/get-cti-assets.dto';
import { exportStixBundle } from './export/stix-exporter';
import { exportMispEvent } from './export/misp-exporter';
import { exportYaraRules } from './export/yara-exporter';

@Injectable()
export class CtiAssetsService {
  constructor(
    @InjectRepository(CtiAsset)
    private readonly assetRepository: Repository<CtiAsset>,
    @InjectRepository(CtiAssetRelation)
    private readonly relationRepository: Repository<CtiAssetRelation>,
  ) {}

  async findAll(
    query: GetCtiAssetsDto,
    workspaceId: string,
  ): Promise<{ items: CtiAsset[]; total: number }> {
    const { page = 1, pageSize = 20, type, ctiTargetId } = query;

    const qb = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.workspaceId = :workspaceId', { workspaceId })
      .orderBy('asset.lastSeenAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (type) {
      qb.andWhere('asset.type = :type', { type });
    }
    if (ctiTargetId) {
      qb.andWhere('asset.ctiTargetId = :ctiTargetId', { ctiTargetId });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, workspaceId: string): Promise<CtiAsset> {
    const asset = await this.assetRepository.findOne({
      where: { id, workspaceId },
      relations: ['ctiTarget'],
    });
    if (!asset) {
      throw new NotFoundException(`CTI Asset ${id} not found`);
    }
    return asset;
  }

  async getRelations(
    id: string,
    workspaceId: string,
  ): Promise<CtiAssetRelation[]> {
    await this.findOne(id, workspaceId);

    return this.relationRepository
      .createQueryBuilder('rel')
      .leftJoinAndSelect('rel.sourceAsset', 'source')
      .leftJoinAndSelect('rel.targetAsset', 'target')
      .where('(rel.sourceAssetId = :id OR rel.targetAssetId = :id)', { id })
      .getMany();
  }

  async getAllAssetsAndRelations(workspaceId: string): Promise<{
    assets: CtiAsset[];
    relations: CtiAssetRelation[];
  }> {
    const assets = await this.assetRepository.find({
      where: { workspaceId },
      order: { threatScore: 'DESC' },
      take: 5000,
    });

    const assetIds = assets.map((a) => a.id);
    const relations =
      assetIds.length > 0
        ? await this.relationRepository
            .createQueryBuilder('rel')
            .where('rel.sourceAssetId IN (:...ids)', { ids: assetIds })
            .orWhere('rel.targetAssetId IN (:...ids)', { ids: assetIds })
            .getMany()
        : [];

    return { assets, relations };
  }

  async exportStix(workspaceId: string): Promise<Record<string, unknown>> {
    const { assets, relations } = await this.getAllAssetsAndRelations(workspaceId);
    return exportStixBundle(assets, relations);
  }

  async exportMisp(
    workspaceId: string,
    workspaceName?: string,
  ): Promise<Record<string, unknown>> {
    const { assets, relations } = await this.getAllAssetsAndRelations(workspaceId);
    return exportMispEvent(assets, relations, workspaceName);
  }

  async exportYara(workspaceId: string): Promise<string> {
    const { assets } = await this.getAllAssetsAndRelations(workspaceId);
    return exportYaraRules(assets);
  }
}
