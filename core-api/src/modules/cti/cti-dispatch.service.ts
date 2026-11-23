import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { JobRunType, JobStatus, JobPriority, ToolCategory } from '@/common/enums/enum';
import { Tool } from '@/modules/tools/entities/tools.entity';
import { Job } from '@/modules/jobs-registry/entities/job.entity';
import { JobHistory } from '@/modules/jobs-registry/entities/job-history.entity';
import { ToolConfigProfilesService } from '@/modules/tools/tool-config-profiles.service';
import { CtiTarget } from './entities/cti-target.entity';

interface CtiTargetEvent {
  target: CtiTarget;
  workspaceId: string;
}

/**
 * Dispatches connector jobs for CTI target events.
 *
 * The standard ASM workflow pipeline (TriggerWorkflowService) cannot handle
 * CTI targets because it relies on ASM assets/scope which do not exist for CTI.
 * This service listens to cti-target.create and cti-target.re-scan events,
 * resolves the Pensieve tool + config, and directly creates a connector job
 * with the right CTI-specific inputs.
 */
@Injectable()
export class CtiDispatchService {
  private readonly logger = new Logger(CtiDispatchService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configProfilesService: ToolConfigProfilesService,
  ) {}

  @OnEvent('cti-target.create', { promisify: true, suppressErrors: false })
  async onTargetCreate(payload: CtiTargetEvent): Promise<void> {
    await this.dispatch(payload, JobRunType.MANUAL);
  }

  @OnEvent('cti-target.re-scan', { promisify: true, suppressErrors: false })
  async onTargetRescan(payload: CtiTargetEvent): Promise<void> {
    await this.dispatch(payload, JobRunType.SCHEDULED);
  }

  private async dispatch(
    payload: CtiTargetEvent,
    jobRunType: JobRunType,
  ): Promise<void> {
    const { target, workspaceId } = payload;

    const toolRepo = this.dataSource.getRepository(Tool);
    const jobRepo = this.dataSource.getRepository(Job);
    const jobHistoryRepo = this.dataSource.getRepository(JobHistory);

    // Find pensieve tool
    const tool = await toolRepo.findOne({ where: { name: 'pensieve' } });
    if (!tool) {
      this.logger.warn('Pensieve tool not found - skipping CTI dispatch');
      return;
    }

    // Resolve and seal config (system-level profile or workspace profile)
    let sealedConfig: Record<string, unknown> | null = null;
    try {
      const config = await this.configProfilesService.resolveConfigForJob(
        workspaceId,
        tool.id!,
        {},
      );
      if (config) {
        sealedConfig = await this.configProfilesService.sealJobConfig(
          workspaceId,
          tool.name,
          config,
        );
      }
    } catch (e) {
      this.logger.warn(
        'Config resolution failed for pensieve (workspace=' + workspaceId + '): ' + e,
      );
      // Continue without config - connector may have optional config
    }

    // Create JobHistory
    const jobHistory = jobHistoryRepo.create({
      jobRunType,
      jobHistoryName: 'CTI: ' + target.type + ' - ' + target.value,
    });
    await jobHistoryRepo.save(jobHistory);

    // Build inputs: target value + type + any metadata fields
    const inputs: Record<string, string> = {
      target: target.value,
      ctiTargetType: target.type,
    };

    // Flatten metadata into inputs (e.g. telegramChannels, keywords, etc.)
    if (target.metadata && typeof target.metadata === 'object') {
      for (const [key, value] of Object.entries(target.metadata)) {
        if (value === null || value === undefined) continue;
        inputs[key] =
          typeof value === 'string' ? value : JSON.stringify(value);
      }
    }

    // Create the connector job
    const jobId = randomUUID();
    const job = jobRepo.create({
      id: jobId,
      jobName: tool.name,
      status: JobStatus.PENDING,
      category: ToolCategory.VULNERABILITIES,
      tool,
      priority: JobPriority.MEDIUM,
      jobHistory,
      inputs,
      config: sealedConfig,
      isSaveRawResult: false,
    } as any);
    await jobRepo.save(job);

    this.logger.log(
      'Dispatched CTI job ' + jobId + ' for ' + target.type + ':' + target.value,
    );
  }
}
