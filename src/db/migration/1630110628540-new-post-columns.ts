import {MigrationInterface, QueryRunner} from "typeorm";

export class newPostColumns1630110628540 implements MigrationInterface {
    name = 'newPostColumns1630110628540'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."post" ADD "text" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."post" ADD "points" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "public"."post" ADD "authorId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "public"."post" ADD CONSTRAINT "FK_c6fb082a3114f35d0cc27c518e0" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."post" DROP CONSTRAINT "FK_c6fb082a3114f35d0cc27c518e0"`);
        await queryRunner.query(`ALTER TABLE "public"."post" DROP COLUMN "authorId"`);
        await queryRunner.query(`ALTER TABLE "public"."post" DROP COLUMN "points"`);
        await queryRunner.query(`ALTER TABLE "public"."post" DROP COLUMN "text"`);
    }

}
