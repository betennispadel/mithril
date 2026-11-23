import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtiTarget } from './entities/cti-target.entity';
import { CtiAsset } from './entities/cti-asset.entity';
import { CtiAssetRelation } from './entities/cti-asset-relation.entity';
import { CtiInvestigation } from './entities/cti-investigation.entity';
import { CtiTargetsController } from './cti-targets.controller';
import { CtiTargetsService } from './cti-targets.service';
import { CtiAssetsController } from './cti-assets.controller';
import { CtiAssetsService } from './cti-assets.service';
import { CtiInvestigationsController } from './cti-investigations.controller';
import { CtiInvestigationsService } from './cti-investigations.service';
import { CtiDispatchService } from './cti-dispatch.service';
import { ToolsModule } from '@/modules/tools/tools.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CtiTarget,
      CtiAsset,
      CtiAssetRelation,
      CtiInvestigation,
    ]),
    ToolsModule,
  ],
  controllers: [
    CtiTargetsController,
    CtiAssetsController,
    CtiInvestigationsController,
  ],
  providers: [
    CtiTargetsService,
    CtiAssetsService,
    CtiInvestigationsService,
    CtiDispatchService,
  ],
  exports: [
    CtiTargetsService,
    CtiAssetsService,
    CtiInvestigationsService,
  ],
})
export class CtiModule {}
