import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CtiTarget } from './entities/cti-target.entity';
import { CreateCtiTargetDto, CreateCtiTargetsBulkDto } from './dto/create-cti-target.dto';
import { GetCtiTargetsDto } from './dto/get-cti-targets.dto';
import { UpdateCtiTargetDto } from './dto/update-cti-target.dto';

@Injectable()
export class CtiTargetsService {
  constructor(
    @InjectRepository(CtiTarget)
    private readonly targetRepository: Repository<CtiTarget>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    dto: CreateCtiTargetDto,
    workspaceId: string,
  ): Promise<CtiTarget> {
    const target = this.targetRepository.create({
      ...dto,
      workspaceId,
    });
    const saved = await this.targetRepository.save(target);
    this.eventEmitter.emit('cti-target.create', {
      target: saved,
      workspaceId,
    });
    return saved;
  }

  async discover(
    dto: CreateCtiTargetsBulkDto,
    workspaceId: string,
  ): Promise<CtiTarget[]> {
    const results: CtiTarget[] = [];

    for (const item of dto.targets) {
      const existing = await this.targetRepository.findOne({
        where: { workspaceId, value: item.value, type: item.type },
      });

      if (existing) {
        results.push(existing);
        this.eventEmitter.emit('cti-target.re-scan', {
          target: existing,
          workspaceId,
        });
        continue;
      }

      const target = this.targetRepository.create({
        ...item,
        workspaceId,
      });
      const saved = await this.targetRepository.save(target);
      results.push(saved);
      this.eventEmitter.emit('cti-target.create', {
        target: saved,
        workspaceId,
      });
    }

    return results;
  }

  async findAll(
    query: GetCtiTargetsDto,
    workspaceId: string,
  ): Promise<{ items: CtiTarget[]; total: number }> {
    const { page = 1, pageSize = 20, type } = query;

    const qb = this.targetRepository
      .createQueryBuilder('target')
      .where('target.workspaceId = :workspaceId', { workspaceId })
      .orderBy('target.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (type) {
      qb.andWhere('target.type = :type', { type });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, workspaceId: string): Promise<CtiTarget> {
    const target = await this.targetRepository.findOne({
      where: { id, workspaceId },
    });
    if (!target) {
      throw new NotFoundException(`CTI Target ${id} not found`);
    }
    return target;
  }

  async update(
    id: string,
    dto: UpdateCtiTargetDto,
    workspaceId: string,
  ): Promise<CtiTarget> {
    const target = await this.findOne(id, workspaceId);
    Object.assign(target, dto);
    return this.targetRepository.save(target);
  }

  async remove(id: string, workspaceId: string): Promise<void> {
    const target = await this.findOne(id, workspaceId);
    await this.targetRepository.remove(target);
  }

  async rescan(id: string, workspaceId: string): Promise<CtiTarget> {
    const target = await this.findOne(id, workspaceId);
    this.eventEmitter.emit('cti-target.re-scan', {
      target,
      workspaceId,
    });
    return target;
  }
}
