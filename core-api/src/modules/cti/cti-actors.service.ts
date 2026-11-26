import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CtiActorProfile } from './entities/cti-actor-profile.entity';

@Injectable()
export class CtiActorsService {
  constructor(
    @InjectRepository(CtiActorProfile)
    private readonly repo: Repository<CtiActorProfile>,
  ) {}

  async list(workspaceId: string, search?: string, limit = 50, offset = 0) {
    const where: any = { workspaceId };
    if (search) where.handle = ILike(`%${search}%`);
    const [data, total] = await this.repo.findAndCount({ where, take: limit, skip: offset, order: { lastSeenAt: 'DESC' } });
    return { data, total };
  }

  async getByHandle(workspaceId: string, handle: string) {
    const actor = await this.repo.findOne({ where: { workspaceId, handle } });
    if (!actor) throw new NotFoundException(`Actor ${handle} not found`);
    return actor;
  }

  async merge(workspaceId: string, primaryHandle: string, secondaryHandle: string) {
    const primary = await this.repo.findOne({ where: { workspaceId, handle: primaryHandle } });
    const secondary = await this.repo.findOne({ where: { workspaceId, handle: secondaryHandle } });
    if (!primary || !secondary) throw new NotFoundException('One or both actors not found');
    primary.aliases = [...new Set([...primary.aliases, secondaryHandle, ...secondary.aliases])];
    primary.sampleCount += secondary.sampleCount;
    primary.confidence = Math.max(primary.confidence, secondary.confidence);
    await this.repo.save(primary);
    await this.repo.remove(secondary);
    return primary;
  }

  async addNote(workspaceId: string, handle: string, text: string) {
    const actor = await this.repo.findOne({ where: { workspaceId, handle } });
    if (!actor) throw new NotFoundException(`Actor ${handle} not found`);
    actor.notes = [...actor.notes, `[${new Date().toISOString()}] ${text}`];
    return this.repo.save(actor);
  }

  async upsertFromRelationship(workspaceId: string, handle: string, entityData: any) {
    let actor = await this.repo.findOne({ where: { workspaceId, handle } });
    if (!actor) {
      actor = this.repo.create({ workspaceId, handle, aliases: [], notes: [], styleVector: {}, associatedEntities: {}, activityTimeline: {}, confidence: entityData.confidence ?? 0.5, sampleCount: 1 });
    } else {
      actor.sampleCount += 1;
      actor.confidence = Math.min(1, actor.confidence + 0.05);
    }
    actor.lastSeenAt = new Date();
    if (!actor.firstSeenAt) actor.firstSeenAt = new Date();
    return this.repo.save(actor);
  }
}
