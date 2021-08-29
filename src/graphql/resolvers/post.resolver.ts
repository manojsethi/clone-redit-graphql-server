import { GraphQLDateTime } from "graphql-scalars";
import { Arg, Ctx, Field, InputType, Int, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { Post } from "../../db/entities/post.entity";
import { isAuth } from "../../middleware/isAuth";
import { GraphQLContextType } from "../graphql_context_type";

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPost {
  @Field(() => [Post])
  posts: Post[];

  @Field(() => Boolean)
  hasMore: Boolean;
}

@Resolver()
export class PostResolver {
  @Query(() => PaginatedPost, { nullable: false, description: "Get All Posts from the database." })
  async posts_ben(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string,
    @Ctx() { dbConnection }: GraphQLContextType
  ): Promise<PaginatedPost> {
    let realLimit = Math.min(50, limit);
    if (realLimit < 0) realLimit = 50;
    let realLimitPlusOne = realLimit + 1;
    var query = dbConnection.getRepository(Post).createQueryBuilder("getPosts");
    query = query.orderBy('"createdAt"', "DESC").take(realLimitPlusOne);
    if (cursor)
      query = query.where('"createdAt" < :cursor', {
        cursor: new Date(cursor),
      });
    let posts = await query.getMany();

    return { posts: posts.slice(0, realLimit), hasMore: posts.length > realLimit };
  }

  @Query(() => PaginatedPost, { nullable: false, description: "Get All Posts from the database." })
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => GraphQLDateTime, { nullable: true }) cursor: Date,
    @Ctx() { dbConnection }: GraphQLContextType
  ): Promise<PaginatedPost> {
    let realLimit = Math.min(50, limit);
    if (realLimit < 0) realLimit = 50;
    let realLimitPlusOne = realLimit + 1;
    var query = dbConnection.getRepository(Post).createQueryBuilder("p");
    query = query
      .orderBy("p.createdAt", "DESC")
      .innerJoinAndSelect("p.author", "c", "c.id = p.authorId")
      .select(["p", "c.id", "c.email", "c.username"])
      .take(realLimitPlusOne);
    if (cursor)
      query = query.where("p.createdAt < :cursor", {
        cursor,
      });
    let posts = await query.getMany();
    return { posts: posts.slice(0, realLimit), hasMore: posts.length > realLimit };
  }

  @Query(() => Post, { nullable: true, description: "Fetches a particular post based on an ID" })
  post(
    @Arg("id", () => Int, { nullable: false, description: "ID of the post to retrieve." })
    id: number,
    @Ctx() { dbConnection }: GraphQLContextType
  ): Promise<Post | null | undefined> {
    return dbConnection.getRepository(Post).findOne({ id: id });
  }

  @Mutation(() => Post, { nullable: true, description: "Creates a new post" })
  @UseMiddleware(isAuth)
  createPost(
    @Arg("postData", () => PostInput, { nullable: false, description: "Details of Post." })
    postData: PostInput,
    @Ctx() { dbConnection, req }: GraphQLContextType
  ): Promise<Post> {
    let newPost: Post = new Post();
    newPost = {
      ...postData,
      authorId: req.session.userid,
    } as Post;
    return dbConnection.getRepository(Post).save(newPost);
  }

  @Mutation(() => Post, { nullable: true, description: "Updates an existing post" })
  async updatePost(
    @Arg("id", () => Int, { nullable: false, description: "ID of the post to be updated." }) id: number,
    @Arg("title", () => String, { nullable: false, description: "Title of new post to be created." })
    title: string,
    @Ctx() { dbConnection }: GraphQLContextType
  ): Promise<Post | undefined> {
    let editPost = await dbConnection.getRepository(Post).findOne({ id });
    if (!editPost) return undefined;
    else {
      editPost.title = title;
      editPost.updatedAt = new Date();
    }
    let updateResult = await dbConnection.getRepository(Post).update({ id: id }, editPost);
    if (updateResult && updateResult.affected && updateResult.affected > 0) return await dbConnection.getRepository(Post).findOne({ id: id });
    return undefined;
  }

  @Mutation(() => Boolean, { nullable: true, description: "Deletes a specific post" })
  async deletePost(
    @Arg("id", () => Int, { nullable: false, description: "ID of the post to be deleted" })
    id: number,
    @Ctx() { dbConnection }: GraphQLContextType
  ): Promise<boolean> {
    let deleteResult = await dbConnection.getRepository(Post).delete({ id });
    if (deleteResult.affected && deleteResult.affected > 0) return true;
    else return false;
  }
}
