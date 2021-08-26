import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
import { Post } from "../../db/entities/post.entity";
import { GraphQLContextType } from "../graphql_context_type";

@Resolver()
export class PostResolver {
  @Query(() => [Post], { nullable: false, description: "Get All Posts from the database." })
  posts(@Ctx() { dbConnection }: GraphQLContextType): Promise<Post[]> {
    return dbConnection.getRepository(Post).find({});
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
  createPost(
    @Arg("title", () => String, { nullable: false, description: "Title of new post to be created." })
    title: string,
    @Ctx() { dbConnection }: GraphQLContextType
  ): Promise<Post> {
    let newPost: Post = new Post();
    newPost.title = title;
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
