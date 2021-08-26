import { NonEmptyArray } from "type-graphql";
import { PostResolver } from "./post.resolver";
import { UserResolver } from "./user.resolver";

const AllResolvers = [PostResolver, UserResolver] as NonEmptyArray<Function>;

export default AllResolvers;
