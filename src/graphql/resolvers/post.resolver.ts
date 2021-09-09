import { GraphQLDateTime } from "graphql-scalars";
import { Arg, Ctx, Field, InputType, Int, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { Post } from "../../db/entities/post.entity";
import { UserPostVotes } from "../../db/entities/votes.entity";
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
    @Ctx() { dbConnection, req }: GraphQLContextType
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

    if (req.session.userid) {
      let postIds = posts.map((p) => p.id);
      let votesStatus = await dbConnection
        .getRepository(UserPostVotes)
        .createQueryBuilder("upv")
        .where('upv."userId" = :userid AND upv."postId" IN (:...postids)', { userid: req.session.userid, postids: postIds })
        .getMany();
      posts = posts.map((p) => {
        let filteredVote = votesStatus.filter((vs) => vs.postId === p.id);
        if (filteredVote && filteredVote.length > 0) p.voteStatus = filteredVote[0].value;
        return p;
      });
    }

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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req, dbConnection }: GraphQLContextType
  ): Promise<Boolean> {
    const userId = req.session.userid;
    let valueToUpdate = 0;
    if (value > 0) valueToUpdate = 1;
    else if (value < 0) valueToUpdate = -1;

    let isUpdated = false;
    let vote = await dbConnection.getRepository(UserPostVotes).findOne({ userId, postId });
    if (vote && vote.value !== valueToUpdate) {
      vote.value += valueToUpdate;
      isUpdated = true;
    } else if (!vote) {
      isUpdated = true;
      vote = new UserPostVotes();
      vote.postId = postId;
      vote.userId = userId as number;
      vote.value = valueToUpdate;
    }
    if (vote && isUpdated) {
      await dbConnection.getRepository(UserPostVotes).save(vote);
      await dbConnection
        .getRepository(Post)
        .createQueryBuilder()
        .update(Post)
        .set({ points: () => "points + :x" })
        .setParameter("x", valueToUpdate)
        .where("id = :id")
        .setParameter("id", postId)
        .execute();
    }
    return true;
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
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int, { nullable: false, description: "ID of the post to be deleted" })
    id: number,
    @Ctx() { dbConnection, req }: GraphQLContextType
  ): Promise<boolean> {
    let deleteResult = await dbConnection.getRepository(Post).delete({ id, authorId: req.session.userid });
    if (deleteResult.affected && deleteResult.affected > 0) return true;
    else return false;
  }
}
