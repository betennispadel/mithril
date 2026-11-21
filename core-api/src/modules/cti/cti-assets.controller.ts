import { WorkspaceAccess } from '@/common/decorators/workspace-access.decorator';
import { WorkspaceId } from '@/common/decorators/workspace-id.decorator';
import { Doc } from '@/common/doc/doc.decorator';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
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
    response: { type: CtiAsset, isArray: true },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.read')
  @Get()
  async getAssets(
    @Query() query: GetCtiAssetsDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findAll(query, workspaceId);
  }

  @Doc({
    summary: 'Get CTI asset details',
    response: { type: CtiAsset },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id')
  async getAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findOne(id, workspaceId);
  }

  @Doc({
    summary: 'Get CTI asset relations',
    description: 'Get graph neighbors of a CTI asset.',
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id/relations')
  async getRelations(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.getRelations(id, workspaceId);
  }
}
