import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhishingCampaign } from './entities/phishing-campaign.entity';
import { PhishingCampaignsController } from './phishing-campaigns.controller';
import { PhishingCampaignsService } from './phishing-campaigns.service';

@Module({
  imports: [TypeOrmModule.forFeature([PhishingCampaign])],
  controllers: [PhishingCampaignsController],
  providers: [PhishingCampaignsService],
  exports: [PhishingCampaignsService],
})
export class PhishingCampaignsModule {}
