import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtiInvestigation } from './entities/cti-investigation.entity';

@Injectable()
export class CtiInvestigationsService {
  constructor(
    @InjectRepository(CtiInvestigation)
    private readonly investigationRepository: Repository<CtiInvestigation>,
  ) {}

  async findAll(
    workspaceId: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ items: CtiInvestigation[]; total: number }> {
    const [items, total] = await this.investigationRepository.findAndCount({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  async findOne(id: string, workspaceId: string): Promise<CtiInvestigation> {
    const investigation = await this.investigationRepository.findOne({
      where: { id, workspaceId },
      relations: ['ctiTarget'],
    });
    if (!investigation) {
      throw new NotFoundException(`CTI Investigation ${id} not found`);
    }
    return investigation;
  }
}
