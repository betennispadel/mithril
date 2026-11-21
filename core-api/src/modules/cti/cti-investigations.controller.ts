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
import { CtiInvestigation } from './entities/cti-investigation.entity';
import { CtiInvestigationsService } from './cti-investigations.service';

@ApiTags('CTI Investigations')
@Controller('cti-investigations')
export class CtiInvestigationsController {
  constructor(private readonly service: CtiInvestigationsService) {}

  @Doc({
    summary: 'List CTI investigations',
    response: { type: CtiInvestigation, isArray: true },
    request: { getWorkspaceId: true },
  })
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
    summary: 'Get CTI investigation details',
    response: { type: CtiInvestigation },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id')
  async getInvestigation(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findOne(id, workspaceId);
  }
}
