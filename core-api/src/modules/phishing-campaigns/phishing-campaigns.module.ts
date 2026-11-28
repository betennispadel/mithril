import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhishingCampaign } from './entities/phishing-campaign.entity';
import { PhishingTemplate } from './entities/phishing-template.entity';
import { PhishingTemplatesController } from './phishing-templates.controller';
import { PhishingTemplatesService } from './phishing-templates.service';
import { PhishingCampaignsController } from './phishing-campaigns.controller';
import { PhishingCampaignsService } from './phishing-campaigns.service';
import { JobsRegistryModule } from '../jobs-registry/jobs-registry.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [TypeOrmModule.forFeature([PhishingCampaign, PhishingTemplate]), JobsRegistryModule, ToolsModule],
  controllers: [PhishingCampaignsController, PhishingTemplatesController],
  providers: [PhishingCampaignsService, PhishingTemplatesService],
  exports: [PhishingCampaignsService, PhishingTemplatesService],
})
export class PhishingCampaignsModule {}
