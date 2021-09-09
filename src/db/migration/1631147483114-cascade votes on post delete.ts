import {MigrationInterface, QueryRunner} from "typeorm";

export class cascadeVotesOnPostDelete1631147483114 implements MigrationInterface {
    name = 'cascadeVotesOnPostDelete1631147483114'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."user_post_votes" DROP CONSTRAINT "FK_15d8f82d7bccf369212ec6db1b7"`);
        await queryRunner.query(`ALTER TABLE "public"."user_post_votes" ADD CONSTRAINT "FK_15d8f82d7bccf369212ec6db1b7" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."user_post_votes" DROP CONSTRAINT "FK_15d8f82d7bccf369212ec6db1b7"`);
        await queryRunner.query(`ALTER TABLE "public"."user_post_votes" ADD CONSTRAINT "FK_15d8f82d7bccf369212ec6db1b7" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
