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
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PhishingCampaign } from './entities/phishing-campaign.entity';
import { CreatePhishingCampaignDto } from './dto/create-campaign.dto';
import { GetPhishingCampaignsDto } from './dto/get-campaigns.dto';
import { PhishingCampaignsService } from './phishing-campaigns.service';

@ApiTags('Phishing Campaigns')
@Controller('phishing-campaigns')
export class PhishingCampaignsController {
  constructor(private readonly service: PhishingCampaignsService) {}

  @Doc({
    summary: 'List phishing campaigns',
    description: 'Get a paginated list of phishing simulation campaigns.',
    response: { type: PhishingCampaign, isArray: true },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.read')
  @Get()
  async getCampaigns(
    @Query() query: GetPhishingCampaignsDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.findAll(query, workspaceId);
  }

  @Doc({
    summary: 'Get phishing campaign details',
    description: 'Get a single phishing campaign with current stats.',
    response: { type: PhishingCampaign },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.read')
  @Get(':id')
  async getCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    // Refresh stats on each detail fetch
    return this.service.updateStats(id, workspaceId);
  }

  @Doc({
    summary: 'Create a phishing campaign',
    description: 'Create a new phishing simulation campaign in draft state.',
    response: { type: PhishingCampaign },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.write')
  @Post()
  async createCampaign(
    @Body() dto: CreatePhishingCampaignDto,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.create(dto, workspaceId);
  }

  @Doc({
    summary: 'Launch a phishing campaign',
    description:
      'Launch a draft campaign. This creates a job for the Imperius connector and starts sending phishing emails.',
    response: { type: PhishingCampaign },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.write')
  @Post(':id/launch')
  async launchCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.launch(id, workspaceId);
  }

  @Doc({
    summary: 'Get campaign results',
    description: 'Get the phishing simulation findings for a campaign.',
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.read')
  @Get(':id/results')
  async getCampaignResults(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.service.getResults(id, workspaceId);
  }

  @Doc({
    summary: 'Delete a phishing campaign',
    description: 'Delete a draft or completed campaign.',
    response: { type: DefaultMessageResponseDto },
    request: { getWorkspaceId: true },
  })
  @WorkspaceAccess('phishing_campaign.write')
  @Delete(':id')
  async deleteCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.service.remove(id, workspaceId);
    return { message: 'Campaign deleted' };
  }
}
