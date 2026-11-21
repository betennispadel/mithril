import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhishingCampaigns1795100000000 implements MigrationInterface {
  name = 'AddPhishingCampaigns1795100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "phishing_campaigns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "workspaceId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "target" character varying NOT NULL,
        "recipients" text NOT NULL,
        "recipientCount" integer NOT NULL,
        "templatePreset" character varying NOT NULL DEFAULT 'password-reset',
        "customSubject" character varying,
        "customHTML" text,
        "landingPreset" character varying NOT NULL DEFAULT 'generic-login',
        "durationMinutes" integer NOT NULL DEFAULT 60,
        "captureCredentials" boolean NOT NULL DEFAULT true,
        "capturePasswords" boolean NOT NULL DEFAULT false,
        "redirectURL" character varying,
        "status" character varying NOT NULL DEFAULT 'draft',
        "jobId" uuid,
        "configProfileId" uuid,
        "launchedAt" TIMESTAMP WITH TIME ZONE,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "emailsSent" integer NOT NULL DEFAULT 0,
        "emailsOpened" integer NOT NULL DEFAULT 0,
        "linksClicked" integer NOT NULL DEFAULT 0,
        "credsSubmitted" integer NOT NULL DEFAULT 0,
        "emailsReported" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_phishing_campaigns" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_phishing_campaigns_workspace" ON "phishing_campaigns" ("workspaceId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_phishing_campaigns_workspace_status" ON "phishing_campaigns" ("workspaceId", "status")`,
    );

    await queryRunner.query(
      `ALTER TABLE "phishing_campaigns" ADD CONSTRAINT "FK_phishing_campaigns_workspace" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "phishing_campaigns" DROP CONSTRAINT "FK_phishing_campaigns_workspace"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_phishing_campaigns_workspace_status"`);
    await queryRunner.query(`DROP INDEX "IDX_phishing_campaigns_workspace"`);
    await queryRunner.query(`DROP TABLE "phishing_campaigns"`);
  }
}
