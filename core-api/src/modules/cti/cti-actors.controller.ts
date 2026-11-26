import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { WorkspaceAccess } from '@/common/decorators/workspace-access.decorator';
import { WorkspaceId } from '@/common/decorators/workspace-id.decorator';
import { CtiActorsService } from './cti-actors.service';

@Controller('cti-actors')
export class CtiActorsController {
  constructor(private readonly service: CtiActorsService) {}

  @WorkspaceAccess('vulnerability.read')
  @Get()
  list(@Query('search') search: string, @Query('limit') limit: string, @Query('offset') offset: string, @WorkspaceId() workspaceId: string) {
    return this.service.list(workspaceId, search, parseInt(limit || '50'), parseInt(offset || '0'));
  }

  @WorkspaceAccess('vulnerability.read')
  @Get(':handle')
  get(@Param('handle') handle: string, @WorkspaceId() workspaceId: string) {
    return this.service.getByHandle(workspaceId, handle);
  }

  @WorkspaceAccess('vulnerability.write')
  @Post(':handle/merge')
  merge(@Param('handle') handle: string, @Body() body: { secondary_handle: string }, @WorkspaceId() workspaceId: string) {
    return this.service.merge(workspaceId, handle, body.secondary_handle);
  }

  @WorkspaceAccess('vulnerability.write')
  @Post(':handle/note')
  addNote(@Param('handle') handle: string, @Body() body: { text: string }, @WorkspaceId() workspaceId: string) {
    return this.service.addNote(workspaceId, handle, body.text);
  }
}
