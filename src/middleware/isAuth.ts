import { MiddlewareFn } from "type-graphql";
import { GraphQLContextType } from "../graphql/graphql_context_type";

export const isAuth: MiddlewareFn<GraphQLContextType> = ({ context }, next) => {
  if (!context.req.session.userid) throw new Error("not authenticated");
  return next();
};
