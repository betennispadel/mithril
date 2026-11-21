import { WorkspaceAccess } from '@/common/decorators/workspace-access.decorator';
import { WorkspaceId } from '@/common/decorators/workspace-id.decorator';
import { Doc } from '@/common/doc/doc.decorator';
import { DefaultMessageResponseDto } from '@/common/dtos/default-message-response.dto';
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
import { CtiTarget } from './entities/cti-target.entity';
import { CreateCtiTargetDto, CreateCtiTargetsBulkDto } from './dto/create-cti-target.dto';
import { GetCtiTargetsDto } from './dto/get-cti-targets.dto';
import { UpdateCtiTargetDto } from './dto/update-cti-target.dto';
import { CtiTargetsService } from './cti-targets.service';

@ApiTags('CTI Targets')
@Controller('cti-targets')
export class CtiTargetsController {
  constructor(private readonly service: CtiTargetsService) {}

  @Doc({
    summary: 'List CTI targets',
    description: 'Get a paginated list of CTI intelligence targets.',
    response: { type: CtiTarget, isArray: true },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.read')
  @Get()
  async getTargets(
    @Query() query: GetCtiTargetsDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findAll(query, workspaceId);
  }

  @Doc({
    summary: 'Get CTI target details',
    response: { type: CtiTarget },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.read')
  @Get(':id')
  async getTarget(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findOne(id, workspaceId);
  }

  @Doc({
    summary: 'Create a CTI target',
    response: { type: CtiTarget },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.write')
  @Post()
  async createTarget(
    @Body() dto: CreateCtiTargetDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.create(dto, workspaceId);
  }

  @Doc({
    summary: 'Bulk create CTI targets and start discovery',
    description: 'Create multiple CTI targets and trigger scans for each.',
    response: { type: CtiTarget, isArray: true },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.write')
  @Post('discover')
  async discover(
    @Body() dto: CreateCtiTargetsBulkDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.discover(dto, workspaceId);
  }

  @Doc({
    summary: 'Update a CTI target',
    response: { type: CtiTarget },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.write')
  @Patch(':id')
  async updateTarget(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCtiTargetDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.update(id, dto, workspaceId);
  }

  @Doc({
    summary: 'Delete a CTI target',
    response: { type: DefaultMessageResponseDto },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.write')
  @Delete(':id')
  async deleteTarget(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.service.remove(id, workspaceId);
    return { message: 'CTI target deleted' };
  }

  @Doc({
    summary: 'Trigger a re-scan for a CTI target',
    response: { type: CtiTarget },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('vulnerability.write')
  @Post(':id/scan')
  async rescan(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.rescan(id, workspaceId);
  }
}
