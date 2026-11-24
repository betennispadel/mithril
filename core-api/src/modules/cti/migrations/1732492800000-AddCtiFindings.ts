import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCtiFindings1732492800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cti_findings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "workspaceId" uuid NOT NULL,
        "ctiTargetId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "severity" varchar NOT NULL DEFAULT 'info',
        "category" varchar,
        "matchedAt" varchar,
        "tags" text[],
        "references" text[],
        "source" varchar,
        "fingerprint" varchar NOT NULL,
        "toolId" uuid,
        "jobHistoryId" uuid,
        "confidence" float,
        "threatScore" int,
        "firstSeenAt" timestamptz NOT NULL DEFAULT now(),
        "lastSeenAt" timestamptz NOT NULL DEFAULT now(),
        "timesDetected" int NOT NULL DEFAULT 1,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_cti_findings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cti_findings_fingerprint" UNIQUE ("fingerprint"),
        CONSTRAINT "FK_cti_findings_target" FOREIGN KEY ("ctiTargetId") REFERENCES "cti_targets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cti_findings_workspace" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cti_findings_tool" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_cti_findings_jobHistory" FOREIGN KEY ("jobHistoryId") REFERENCES "job_histories"("id") ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS "IDX_cti_findings_workspace" ON "cti_findings" ("workspaceId");
      CREATE INDEX IF NOT EXISTS "IDX_cti_findings_target" ON "cti_findings" ("ctiTargetId");
      CREATE INDEX IF NOT EXISTS "IDX_cti_findings_workspace_severity" ON "cti_findings" ("workspaceId", "severity");
      CREATE INDEX IF NOT EXISTS "IDX_cti_findings_workspace_category" ON "cti_findings" ("workspaceId", "category");
      CREATE INDEX IF NOT EXISTS "IDX_cti_findings_createdAt" ON "cti_findings" ("createdAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cti_findings" CASCADE`);
  }
}
