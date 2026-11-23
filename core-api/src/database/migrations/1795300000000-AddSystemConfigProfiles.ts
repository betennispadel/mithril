import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemConfigProfiles1795300000000 implements MigrationInterface {
  name = 'AddSystemConfigProfiles1795300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tool_config_profiles" ADD COLUMN "isSystem" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tcp_system" ON "tool_config_profiles" ("isSystem") WHERE "isSystem" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_tcp_system"`);
    await queryRunner.query(
      `ALTER TABLE "tool_config_profiles" DROP COLUMN "isSystem"`,
    );
  }
}
