import { WorkspaceAccess } from '@/common/decorators/workspace-access.decorator';
import { WorkspaceId } from '@/common/decorators/workspace-id.decorator';
import { Doc } from '@/common/doc/doc.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CtiInvestigation } from './entities/cti-investigation.entity';
import { CtiInvestigationsService } from './cti-investigations.service';

@ApiTags('CTI Investigations')
@Controller('cti-investigations')
export class CtiInvestigationsController {
  constructor(private readonly service: CtiInvestigationsService) {}

  @Doc({
    summary: 'Create a CTI investigation',
    description: 'Start a new deep-search investigation for a query.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.write')
  @Post()
  async createInvestigation(
    @Body() body: { query: string; ctiTargetId?: string },
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.create(workspaceId, body.query, body.ctiTargetId);
  }

  @Doc({
    summary: 'List CTI investigations',
    response: { isArray: true },
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get()
  async getInvestigations(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findAll(workspaceId, page, pageSize);
  }

  @Doc({
    summary: 'Get CTI investigation details with entities and findings', request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id')
  async getInvestigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 50,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findOneWithEntities(id, workspaceId, page, pageSize);
  }

  @Doc({
    summary: 'Get investigation pages',
    description: 'Get the list of pages scraped during this investigation.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id/pages')
  async getPages(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.getPages(id, workspaceId);
  }

  @Doc({
    summary: 'Get investigation timeline',
    description: 'Get the step-by-step pipeline execution timeline.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id/timeline')
  async getTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.getTimeline(id, workspaceId);
  }

  @Doc({
    summary: 'Get investigation AI summary',
    description: 'Get the AI-generated summary and sources used.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id/summary')
  async getSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.getSummary(id, workspaceId);
  }

  @Doc({
    summary: 'Get investigation progress',
    description: 'Get current step, label, and status for polling.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id/progress')
  async getProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.getProgress(id, workspaceId);
  }

  @Doc({
    summary: 'Cancel investigation',
    description: 'Cancel a running investigation.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.write')
  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.cancel(id, workspaceId);
  }
}
