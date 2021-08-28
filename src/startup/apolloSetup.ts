import { ApolloServer } from "apollo-server-express";
import express from "express";
import { Redis } from "ioredis";
import { buildSchema } from "type-graphql";
import DBContext from "../db/DBContext";
import { GraphQLContextType } from "../graphql/graphql_context_type";
import { graphQLScalarsMap } from "../graphql/graphql_scalars_map";
import AllResolvers from "../graphql/resolvers";

const apolloSetup = async (app: express.Express, redisClient: Redis) => {
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      scalarsMap: graphQLScalarsMap,
      resolvers: AllResolvers,
      validate: false,
    }),

    context: ({ req, res }): GraphQLContextType => ({ dbConnection: DBContext.connection, req, res, redis: redisClient }),
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: {
      credentials: true,
      origin: ["https://studio.apollographql.com", "http://localhost:3000"],
    },
  });
};

export default apolloSetup;
