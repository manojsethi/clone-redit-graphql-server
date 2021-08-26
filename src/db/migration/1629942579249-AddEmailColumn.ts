import {MigrationInterface, QueryRunner} from "typeorm";

export class AddEmailColumn1629942579249 implements MigrationInterface {
    name = 'AddEmailColumn1629942579249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."user" ADD "email" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."user" DROP COLUMN "email"`);
    }

}
