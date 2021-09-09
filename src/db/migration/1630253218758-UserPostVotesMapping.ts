import {MigrationInterface, QueryRunner} from "typeorm";

export class UserPostVotesMapping1630253218758 implements MigrationInterface {
    name = 'UserPostVotesMapping1630253218758'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_post_votes" ("value" integer NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, CONSTRAINT "PK_7ba5d366309b43356d9b81a64b0" PRIMARY KEY ("userId", "postId"))`);
        await queryRunner.query(`ALTER TABLE "user_post_votes" ADD CONSTRAINT "FK_8eaaa66e008566ea4562c1a65f0" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_post_votes" ADD CONSTRAINT "FK_15d8f82d7bccf369212ec6db1b7" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_post_votes" DROP CONSTRAINT "FK_15d8f82d7bccf369212ec6db1b7"`);
        await queryRunner.query(`ALTER TABLE "user_post_votes" DROP CONSTRAINT "FK_8eaaa66e008566ea4562c1a65f0"`);
        await queryRunner.query(`DROP TABLE "user_post_votes"`);
    }

}
