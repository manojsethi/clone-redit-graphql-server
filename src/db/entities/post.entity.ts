import { GraphQLDateTime } from "graphql-scalars";
import { Arg, Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { UserPostVotes } from "./votes.entity";

@ObjectType()
@Entity({ name: "post" })
export class Post extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({
    type: "varchar",
  })
  title: string;

  @Field(() => String)
  @Column({
    type: "varchar",
  })
  text: string;

  @Field((type) => String)
  excerpt(@Arg("length", () => Int, { nullable: true }) length: number): String {
    if (!length) length = 50;
    if (this.text.length > length) return this.text.slice(0, length) + "...";
    else return this.text;
  }

  @Field((type) => String)
  textSnippet() {
    let length = 50;
    if (this.text.length > length) return this.text.slice(0, length) + "...";
    else return this.text;
  }

  @Field(() => Number)
  @Column({
    type: "int",
    default: 0,
  })
  points: number;

  @Field()
  @Column()
  authorId: number;

  @Field()
  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @Field(() => Int, { nullable: true })
  voteStatus: number | null;

  @OneToMany(() => UserPostVotes, (vote) => vote.post)
  votes: UserPostVotes[];

  @Field(() => GraphQLDateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLDateTime)
  @UpdateDateColumn()
  updatedAt: Date;
}
