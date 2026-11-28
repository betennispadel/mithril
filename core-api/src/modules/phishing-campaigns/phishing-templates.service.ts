import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PhishingTemplate,
  PhishingTemplateType,
} from './entities/phishing-template.entity';

export interface CreatePhishingTemplateDto {
  name: string;
  type: PhishingTemplateType;
  subject?: string;
  html: string;
  description?: string;
  clonedFrom?: string;
}

export interface UpdatePhishingTemplateDto {
  name?: string;
  subject?: string;
  html?: string;
  description?: string;
}

@Injectable()
export class PhishingTemplatesService {
  constructor(
    @InjectRepository(PhishingTemplate)
    private readonly repo: Repository<PhishingTemplate>,
  ) {}

  async create(
    dto: CreatePhishingTemplateDto,
    workspaceId: string,
  ): Promise<PhishingTemplate> {
    const template = this.repo.create({ ...dto, workspaceId });
    return this.repo.save(template);
  }

  async findAll(
    workspaceId: string,
    type?: PhishingTemplateType,
  ): Promise<PhishingTemplate[]> {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.workspaceId = :workspaceId', { workspaceId })
      .orderBy('t.createdAt', 'DESC');

    if (type) {
      qb.andWhere('t.type = :type', { type });
    }

    return qb.getMany();
  }

  async findOne(id: string, workspaceId: string): Promise<PhishingTemplate> {
    const template = await this.repo.findOne({
      where: { id, workspaceId },
    });
    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }
    return template;
  }

  async update(
    id: string,
    workspaceId: string,
    dto: UpdatePhishingTemplateDto,
  ): Promise<PhishingTemplate> {
    const template = await this.findOne(id, workspaceId);
    Object.assign(template, dto);
    return this.repo.save(template);
  }

  async remove(id: string, workspaceId: string): Promise<void> {
    const template = await this.findOne(id, workspaceId);
    await this.repo.remove(template);
  }
}
