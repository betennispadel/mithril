import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCtiModule1795200000000 implements MigrationInterface {
  name = 'AddCtiModule1795200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. cti_targets
    await queryRunner.query(`
      CREATE TABLE "cti_targets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "workspaceId" uuid NOT NULL,
        "value" character varying NOT NULL,
        "type" character varying NOT NULL,
        "label" character varying,
        "source" character varying NOT NULL DEFAULT 'MANUAL',
        "scanSchedule" character varying NOT NULL DEFAULT 'disabled',
        "lastScanAt" TIMESTAMP WITH TIME ZONE,
        "isEnabled" boolean NOT NULL DEFAULT true,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_cti_targets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cti_targets_workspace_value_type" UNIQUE ("workspaceId", "value", "type")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_cti_targets_workspace" ON "cti_targets" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cti_targets_workspace_type" ON "cti_targets" ("workspaceId", "type")`,
    );

    await queryRunner.query(
      `ALTER TABLE "cti_targets" ADD CONSTRAINT "FK_cti_targets_workspace" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // 2. cti_assets
    await queryRunner.query(`
      CREATE TABLE "cti_assets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "workspaceId" uuid NOT NULL,
        "ctiTargetId" uuid NOT NULL,
        "value" character varying NOT NULL,
        "type" character varying NOT NULL,
        "confidence" double precision NOT NULL DEFAULT 0,
        "threatScore" integer NOT NULL DEFAULT 0,
        "source" character varying,
        "firstSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isActive" boolean NOT NULL DEFAULT true,
        "stixType" character varying,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_cti_assets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cti_assets_workspace_target_value_type" UNIQUE ("workspaceId", "ctiTargetId", "value", "type")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_cti_assets_workspace" ON "cti_assets" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cti_assets_target" ON "cti_assets" ("ctiTargetId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cti_assets_workspace_type" ON "cti_assets" ("workspaceId", "type")`,
    );

    await queryRunner.query(
      `ALTER TABLE "cti_assets" ADD CONSTRAINT "FK_cti_assets_workspace" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cti_assets" ADD CONSTRAINT "FK_cti_assets_target" FOREIGN KEY ("ctiTargetId") REFERENCES "cti_targets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // 3. cti_asset_relations
    await queryRunner.query(`
      CREATE TABLE "cti_asset_relations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "workspaceId" uuid NOT NULL,
        "sourceAssetId" uuid NOT NULL,
        "targetAssetId" uuid NOT NULL,
        "relationType" character varying NOT NULL,
        "confidence" double precision NOT NULL DEFAULT 0,
        "source" character varying,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_cti_asset_relations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cti_asset_relations_source_target_type" UNIQUE ("sourceAssetId", "targetAssetId", "relationType")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_cti_asset_relations_source" ON "cti_asset_relations" ("sourceAssetId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cti_asset_relations_target" ON "cti_asset_relations" ("targetAssetId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "cti_asset_relations" ADD CONSTRAINT "FK_cti_asset_relations_source" FOREIGN KEY ("sourceAssetId") REFERENCES "cti_assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cti_asset_relations" ADD CONSTRAINT "FK_cti_asset_relations_target" FOREIGN KEY ("targetAssetId") REFERENCES "cti_assets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // 4. cti_investigations
    await queryRunner.query(`
      CREATE TABLE "cti_investigations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "workspaceId" uuid NOT NULL,
        "ctiTargetId" uuid,
        "query" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "entityCount" integer NOT NULL DEFAULT 0,
        "jobId" uuid,
        "startedAt" TIMESTAMP WITH TIME ZONE,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_cti_investigations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_cti_investigations_workspace" ON "cti_investigations" ("workspaceId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "cti_investigations" ADD CONSTRAINT "FK_cti_investigations_workspace" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cti_investigations" ADD CONSTRAINT "FK_cti_investigations_target" FOREIGN KEY ("ctiTargetId") REFERENCES "cti_targets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "cti_investigations" DROP CONSTRAINT "FK_cti_investigations_target"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cti_investigations" DROP CONSTRAINT "FK_cti_investigations_workspace"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cti_asset_relations" DROP CONSTRAINT "FK_cti_asset_relations_target"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cti_asset_relations" DROP CONSTRAINT "FK_cti_asset_relations_source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cti_assets" DROP CONSTRAINT "FK_cti_assets_target"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cti_assets" DROP CONSTRAINT "FK_cti_assets_workspace"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cti_targets" DROP CONSTRAINT "FK_cti_targets_workspace"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_cti_investigations_workspace"`);
    await queryRunner.query(`DROP INDEX "IDX_cti_asset_relations_target"`);
    await queryRunner.query(`DROP INDEX "IDX_cti_asset_relations_source"`);
    await queryRunner.query(`DROP INDEX "IDX_cti_assets_workspace_type"`);
    await queryRunner.query(`DROP INDEX "IDX_cti_assets_target"`);
    await queryRunner.query(`DROP INDEX "IDX_cti_assets_workspace"`);
    await queryRunner.query(`DROP INDEX "IDX_cti_targets_workspace_type"`);
    await queryRunner.query(`DROP INDEX "IDX_cti_targets_workspace"`);

    // Drop tables (reverse order)
    await queryRunner.query(`DROP TABLE "cti_investigations"`);
    await queryRunner.query(`DROP TABLE "cti_asset_relations"`);
    await queryRunner.query(`DROP TABLE "cti_assets"`);
    await queryRunner.query(`DROP TABLE "cti_targets"`);
  }
}
