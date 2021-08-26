import { GraphQLDateTime } from "graphql-scalars";
import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

  @Field(() => GraphQLDateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLDateTime)
  @UpdateDateColumn()
  updatedAt: Date;
}
