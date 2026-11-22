import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhishingCampaign } from './entities/phishing-campaign.entity';
import { PhishingCampaignsController } from './phishing-campaigns.controller';
import { PhishingCampaignsService } from './phishing-campaigns.service';
import { JobsRegistryModule } from '../jobs-registry/jobs-registry.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [TypeOrmModule.forFeature([PhishingCampaign]), JobsRegistryModule, ToolsModule],
  controllers: [PhishingCampaignsController],
  providers: [PhishingCampaignsService],
  exports: [PhishingCampaignsService],
})
export class PhishingCampaignsModule {}
