import { GraphQLDateTime } from "graphql-scalars";
import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

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

  @Field(() => Number)
  @Column({
    type: "int",
    default: 0,
  })
  points: number;

  @Field()
  @Column()
  authorId: number;

  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @Field(() => GraphQLDateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLDateTime)
  @UpdateDateColumn()
  updatedAt: Date;
}
