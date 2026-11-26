import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtiTarget } from './entities/cti-target.entity';
import { CtiAsset } from './entities/cti-asset.entity';
import { CtiAssetRelation } from './entities/cti-asset-relation.entity';
import { CtiInvestigation } from './entities/cti-investigation.entity';
import { CtiFinding } from './entities/cti-finding.entity';
import { CtiPage } from './entities/cti-page.entity';
import { CtiDataAdapterService } from './cti-data-adapter.service';
import { CtiTargetsController } from './cti-targets.controller';
import { CtiTargetsService } from './cti-targets.service';
import { CtiAssetsController } from './cti-assets.controller';
import { CtiAssetsService } from './cti-assets.service';
import { CtiInvestigationsController } from './cti-investigations.controller';
import { CtiFindingsController } from './cti-findings.controller';
import { CtiInvestigationsService } from './cti-investigations.service';
import { CtiDispatchService } from './cti-dispatch.service';
import { ToolsModule } from '@/modules/tools/tools.module';
import { CtiActorProfile } from './entities/cti-actor-profile.entity';
import { CtiMonitor } from './entities/cti-monitor.entity';
import { CtiMonitorAlert } from './entities/cti-monitor-alert.entity';
import { CtiActorsService } from './cti-actors.service';
import { CtiActorsController } from './cti-actors.controller';
import { CtiMonitorsService } from './cti-monitors.service';
import { CtiMonitorsController } from './cti-monitors.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CtiTarget,
      CtiAsset,
      CtiAssetRelation,
      CtiInvestigation,
      CtiFinding,
      CtiPage,
      CtiActorProfile,
      CtiMonitor,
      CtiMonitorAlert,
    ]),
    ToolsModule,
  ],
  controllers: [
    CtiTargetsController,
    CtiAssetsController,
    CtiInvestigationsController,
    CtiFindingsController,
    CtiActorsController,
    CtiMonitorsController,
  ],
  providers: [
    CtiTargetsService,
    CtiAssetsService,
    CtiInvestigationsService,
    CtiDispatchService,
    CtiDataAdapterService,
    CtiActorsService,
    CtiMonitorsService,
  ],
  exports: [
    CtiTargetsService,
    CtiAssetsService,
    CtiInvestigationsService,
    CtiDataAdapterService,
    CtiActorsService,
    CtiMonitorsService,
  ],
})
export class CtiModule {}
