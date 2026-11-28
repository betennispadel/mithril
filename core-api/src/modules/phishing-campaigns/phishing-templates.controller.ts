import { WorkspaceAccess } from '@/common/decorators/workspace-access.decorator';
import { WorkspaceId } from '@/common/decorators/workspace-id.decorator';
import { Doc } from '@/common/doc/doc.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PhishingTemplatesService } from './phishing-templates.service';
import type { PhishingTemplateType } from './entities/phishing-template.entity';

@ApiTags('Phishing Templates')
@Controller('phishing-templates')
export class PhishingTemplatesController {
  constructor(private readonly service: PhishingTemplatesService) {}

  @Doc({
    summary: 'List saved phishing templates',
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.read')
  @Get()
  async list(
    @WorkspaceId() workspaceId: string,
    @Query('type') type?: PhishingTemplateType,
  ) {
    return this.service.findAll(workspaceId, type);
  }

  @Doc({
    summary: 'Get a phishing template',
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.read')
  @Get(':id')
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findOne(id, workspaceId);
  }

  @Doc({
    summary: 'Create a phishing template',
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.write')
  @Post()
  async create(
    @Body() dto: { name: string; type: PhishingTemplateType; subject?: string; html: string; description?: string; clonedFrom?: string },
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.create(dto, workspaceId);
  }

  @Doc({
    summary: 'Update a phishing template',
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.write')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; subject?: string; html?: string; description?: string },
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.update(id, workspaceId, dto);
  }

  @Doc({
    summary: 'Delete a phishing template',
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.write')
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.service.remove(id, workspaceId);
    return { message: 'Template deleted' };
  }
}
