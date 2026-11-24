import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { WorkspaceAccess } from '@/common/decorators/workspace-access.decorator';
import { WorkspaceId } from '@/common/decorators/workspace-id.decorator';

@ApiTags('CTI Findings')
@Controller('cti-findings')
export class CtiFindingsController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @WorkspaceAccess()
  async findAll(
    @WorkspaceId() workspaceId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('category') category?: string,
    @Query('severity') severity?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy = 'firstSeenAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const p = parseInt(page, 10) || 1;
    const ps = Math.min(parseInt(pageSize, 10) || 20, 100);
    const offset = (p - 1) * ps;

    const allowedSort = ['firstSeenAt', 'severity', 'name', 'category', 'createdAt'];
    const sort = allowedSort.includes(sortBy) ? '"' + sortBy + '"' : '"firstSeenAt"';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let where = 'WHERE "workspaceId" = ';
    const params: any[] = [workspaceId];
    let paramIdx = 2;

    if (category) {
      where += ' AND category = $' + paramIdx;
      params.push(category);
      paramIdx++;
    }
    if (severity) {
      where += ' AND severity = $' + paramIdx;
      params.push(severity);
      paramIdx++;
    }
    if (search) {
      where += ' AND (name ILIKE $' + paramIdx + ' OR description ILIKE $' + paramIdx + ' OR "matchedAt" ILIKE $' + paramIdx + ')';
      params.push('%' + search + '%');
      paramIdx++;
    }

    const [items, countResult] = await Promise.all([
      this.dataSource.query(
        'SELECT id, name, severity, description, category, tags, "matchedAt", source, "firstSeenAt", "lastSeenAt", "timesDetected", fingerprint, metadata FROM cti_findings ' + where + ' ORDER BY ' + sort + ' ' + order + ' LIMIT $' + paramIdx + ' OFFSET $' + (paramIdx + 1),
        [...params, ps, offset],
      ),
      this.dataSource.query(
        'SELECT COUNT(*) as count FROM cti_findings ' + where,
        params,
      ),
    ]);

    const total = parseInt(countResult[0]?.count ?? '0', 10);

    const severitySummary = await this.dataSource.query(
      'SELECT severity, COUNT(*) as count FROM cti_findings WHERE "workspaceId" = ' + (category ? ' AND category = ' : '') + ' GROUP BY severity',
      category ? [workspaceId, category] : [workspaceId],
    );

    return {
      items,
      total,
      page: p,
      pageSize: ps,
      totalPages: Math.ceil(total / ps),
      severitySummary,
    };
  }
}
