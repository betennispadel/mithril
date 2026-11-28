import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolCategory } from '@/common/enums/enum';
import { PhishingCampaign, PhishingCampaignStatus } from './entities/phishing-campaign.entity';
import { CreatePhishingCampaignDto } from './dto/create-campaign.dto';
import { GetPhishingCampaignsDto } from './dto/get-campaigns.dto';
import { JobsRegistryService } from '@/modules/jobs-registry/jobs-registry.service';
import { ToolsService } from '@/modules/tools/tools.service';

@Injectable()
export class PhishingCampaignsService {
  constructor(
    @InjectRepository(PhishingCampaign)
    private readonly campaignRepository: Repository<PhishingCampaign>,
    private readonly jobsRegistryService: JobsRegistryService,
    private readonly toolsService: ToolsService,
  ) {}

  async create(
    dto: CreatePhishingCampaignDto,
    workspaceId: string,
  ): Promise<PhishingCampaign> {
    const recipientCount = dto.recipients
      .split(';')
      .filter((r) => r.trim() && r.includes('@')).length;

    if (recipientCount === 0) {
      throw new BadRequestException('At least one valid recipient is required');
    }

    const campaign = this.campaignRepository.create({
      ...dto,
      workspaceId,
      recipientCount,
      status: PhishingCampaignStatus.DRAFT,
    });

    return this.campaignRepository.save(campaign);
  }

  async findAll(
    query: GetPhishingCampaignsDto,
    workspaceId: string,
  ): Promise<{ items: PhishingCampaign[]; total: number }> {
    const { page = 1, pageSize = 20, status } = query;

    const qb = this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.workspaceId = :workspaceId', { workspaceId })
      .orderBy('campaign.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (status) {
      qb.andWhere('campaign.status = :status', { status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, workspaceId: string): Promise<PhishingCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id, workspaceId },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    return campaign;
  }

  async launch(id: string, workspaceId: string): Promise<PhishingCampaign> {
    const campaign = await this.findOne(id, workspaceId);

    if (campaign.status !== PhishingCampaignStatus.DRAFT) {
      throw new BadRequestException(
        `Campaign is already ${campaign.status}, only draft campaigns can be launched`,
      );
    }

    // Find the Imperius tool
    const tools = await this.toolsService.getToolByNames({
      names: ['imperius'],
    });
    if (tools.length === 0) {
      throw new BadRequestException(
        'Imperius tool not found. Please install the Phishing Simulation connector first.',
      );
    }
    const imperiusTool = tools[0];

    // Build connector config from campaign fields
    const config: Record<string, unknown> = {
      templatePreset: campaign.templatePreset,
      landingPreset: campaign.landingPreset,
      campaignDurationMinutes: campaign.durationMinutes,
      captureCredentials: campaign.captureCredentials,
      capturePasswords: campaign.capturePasswords,
    };
    if (campaign.customSubject) config.customTemplateSubject = campaign.customSubject;
    if (campaign.customHTML) config.customTemplateHTML = campaign.customHTML;
    if (campaign.redirectURL) config.redirectURL = campaign.redirectURL;
    if (campaign.customLandingHTML) config.customLandingHTML = campaign.customLandingHTML;

    // Create the job via the existing job system
    const jobs = await this.jobsRegistryService.createNewJob({
      tool: imperiusTool,
      targetIds: [],
      workspaceId,
      config,
      configProfileId: campaign.configProfileId ?? undefined,
      category: ToolCategory.PHISHING_SIMULATION,
      jobName: `Phishing: ${campaign.name}`,
      isPublishEvent: true,
      input: undefined,
      // Pass target and recipients as inputs
      inputs: {
        target: campaign.target,
        recipients: campaign.recipients,
      },
    } as any);

    // Update campaign with job reference
    const jobId = jobs[0]?.id;
    const jobHistoryId = jobs[0]?.jobHistory?.id;

    campaign.status = PhishingCampaignStatus.RUNNING;
    campaign.jobId = jobId ?? null;
    campaign.launchedAt = new Date();

    return this.campaignRepository.save(campaign);
  }

  async getResults(
    id: string,
    workspaceId: string,
  ): Promise<{ campaign: PhishingCampaign; findings: any[] }> {
    const campaign = await this.findOne(id, workspaceId);

    if (!campaign.jobId) {
      return { campaign, findings: [] };
    }

    // Query vulnerabilities linked to this campaign's job via tags
    // The connector tags all findings with 'phishing'
    const findings = await this.campaignRepository.manager.query(
      `SELECT v.id, v.name, v.severity, v.description, v.tags,
              v."matchedAt", v."createdAt"
       FROM vulnerabilities v
       INNER JOIN jobs j ON j.id = $1
       INNER JOIN job_histories jh ON jh.id = j."jobHistoryId"
       WHERE v."jobHistoryId" = jh.id
         AND 'phishing' = ANY(v.tags)
       ORDER BY v."createdAt" ASC`,
      [campaign.jobId],
    );

    return { campaign, findings };
  }

  async updateStats(id: string, workspaceId: string): Promise<PhishingCampaign> {
    const { campaign, findings } = await this.getResults(id, workspaceId);

    let sent = 0, opened = 0, clicked = 0, submitted = 0, reported = 0;

    for (const f of findings) {
      const tags: string[] = f.tags ?? [];
      if (tags.includes('email-opened')) opened++;
      else if (tags.includes('link-clicked')) clicked++;
      else if (tags.includes('credential-harvest')) submitted++;
      else if (tags.includes('email-reported')) reported++;
      else if (tags.includes('simulation-summary') && tags.includes('click-rate')) {
        // Parse sent count from summary description
        const match = f.description?.match(/Emails sent: (\d+)/);
        if (match) sent = parseInt(match[1], 10);
      }
    }

    // If no summary yet, estimate sent as recipientCount
    if (sent === 0) sent = campaign.recipientCount;

    campaign.emailsSent = sent;
    campaign.emailsOpened = opened;
    campaign.linksClicked = clicked;
    campaign.credsSubmitted = submitted;
    campaign.emailsReported = reported;

    // Check if job completed
    if (campaign.jobId && campaign.status === PhishingCampaignStatus.RUNNING) {
      const job = await this.campaignRepository.manager.findOne('Job' as any, {
        where: { id: campaign.jobId },
      });
      if (job && ['completed', 'failed'].includes((job as any).status)) {
        campaign.status =
          (job as any).status === 'completed'
            ? PhishingCampaignStatus.COMPLETED
            : PhishingCampaignStatus.FAILED;
        campaign.completedAt = new Date();
      }
    }

    return this.campaignRepository.save(campaign);
  }

  async remove(id: string, workspaceId: string): Promise<void> {
    const campaign = await this.findOne(id, workspaceId);
    if (campaign.status === PhishingCampaignStatus.RUNNING) {
      throw new BadRequestException('Cannot delete a running campaign');
    }
    await this.campaignRepository.remove(campaign);
  }
}
