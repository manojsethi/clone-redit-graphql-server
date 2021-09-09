import { GraphQLDateTime } from "graphql-scalars";
import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "./post.entity";
import { UserPostVotes } from "./votes.entity";

@ObjectType()
@Entity({ name: "user" })
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({
    type: "varchar",
  })
  username!: string;

  @Field(() => String)
  @Column({
    type: "varchar",
  })
  email!: string;

  @OneToMany(() => UserPostVotes, (vote) => vote.user)
  votes: UserPostVotes[];

  @Column({
    type: "varchar",
  })
  password!: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @Field(() => GraphQLDateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLDateTime)
  @UpdateDateColumn()
  updatedAt: Date;
}
