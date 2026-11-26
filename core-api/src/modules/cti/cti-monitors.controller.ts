import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { WorkspaceAccess } from '@/common/decorators/workspace-access.decorator';
import { WorkspaceId } from '@/common/decorators/workspace-id.decorator';
import { CtiMonitorsService } from './cti-monitors.service';

@Controller('cti-monitors')
export class CtiMonitorsController {
  constructor(private readonly service: CtiMonitorsService) {}

  @WorkspaceAccess('vulnerability.write')
  @Post()
  create(@Body() body: { name: string; query: string; interval?: string; deliveryChannels?: Record<string, any> }, @WorkspaceId() workspaceId: string) {
    return this.service.create(workspaceId, body);
  }

  @WorkspaceAccess('vulnerability.read')
  @Get()
  list(@WorkspaceId() workspaceId: string) {
    return this.service.list(workspaceId);
  }

  @WorkspaceAccess('vulnerability.read')
  @Get(':id/alerts')
  getAlerts(@Param('id') id: string, @Query('limit') limit: string, @WorkspaceId() workspaceId: string) {
    return this.service.getAlerts(id, workspaceId, parseInt(limit || '20'));
  }

  @WorkspaceAccess('vulnerability.write')
  @Delete(':id')
  remove(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.service.remove(id, workspaceId);
  }
}
