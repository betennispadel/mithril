import { WorkspaceAccess } from '@/common/decorators/workspace-access.decorator';
import { WorkspaceId } from '@/common/decorators/workspace-id.decorator';
import { Doc } from '@/common/doc/doc.decorator';
import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  Res } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import { CtiAsset } from './entities/cti-asset.entity';
import { GetCtiAssetsDto } from './dto/get-cti-assets.dto';
import { CtiAssetsService } from './cti-assets.service';

@ApiTags('CTI Assets')
@Controller('cti-assets')
export class CtiAssetsController {
  constructor(private readonly service: CtiAssetsService) {}

  @Doc({
    summary: 'List CTI assets',
    description: 'Get a paginated list of CTI intelligence assets.',
    response: { isArray: true },
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get()
  async getAssets(
    @Query() query: GetCtiAssetsDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findAll(query, workspaceId);
  }

  @Doc({
    summary: 'Get CTI asset details', request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id')
  async getAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findOne(id, workspaceId);
  }

  @Doc({
    summary: 'Get CTI entity graph',
    description: 'Get nodes and edges for entity relationship visualization.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get('graph')
  async getGraph(
    @WorkspaceId() workspaceId: string,
    @Query('rootAssetId') rootAssetId?: string,
    @Query('depth') depth?: string,
  ) {
    return this.service.getGraph(
      workspaceId,
      rootAssetId,
      depth ? parseInt(depth, 10) : 2,
    );
  }

  @Doc({
    summary: 'Export CTI assets as STIX 2.1 Bundle',
    description: 'Download all CTI assets in STIX 2.1 JSON format.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get('export/stix')
  @Header('Content-Type', 'application/json')
  async exportStix(@WorkspaceId() workspaceId: string) {
    return this.service.exportStix(workspaceId);
  }

  @Doc({
    summary: 'Export CTI assets as MISP Event',
    description: 'Download all CTI assets in MISP JSON format.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get('export/misp')
  @Header('Content-Type', 'application/json')
  async exportMisp(@WorkspaceId() workspaceId: string) {
    return this.service.exportMisp(workspaceId);
  }

  @Doc({
    summary: 'Export CTI assets as YARA rules',
    description: 'Download IOC-based YARA rules generated from CTI assets.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get('export/yara')
  async exportYara(
    @WorkspaceId() workspaceId: string,
    @Res() res: any,
  ) {
    const rules = await this.service.exportYara(workspaceId);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="pensieve-cti-${new Date().toISOString().slice(0, 10)}.yar"`,
    );
    res.send(rules);
  }

  @Doc({
    summary: 'Get CTI asset relations',
    description: 'Get graph neighbors of a CTI asset.',
    request: { getWorkspaceId: true } })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id/relations')
  async getRelations(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.getRelations(id, workspaceId);
  }
}
