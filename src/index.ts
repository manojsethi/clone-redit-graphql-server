import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import express from "express";
import session from "express-session";
import redis from "redis";
import { buildSchema } from "type-graphql";
import DBContext from "./db/DBContext";
import { GraphQLContextType } from "./graphql/graphql_context_type";
import { graphQLScalarsMap } from "./graphql/graphql_scalars_map";
import AllResolvers from "./graphql/resolvers";
const main = async () => {
  await DBContext.createDBConnection();
  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    session({
      name: "qid",
      saveUninitialized: false,
      secret: "ajskdlkjalkfjksldfjlksdjfslkdjflksdjfkalsdjfsalkdjlfadsjlkfsjald",
      resave: false,
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        sameSite: "lax",
        httpOnly: true,
      },
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      scalarsMap: graphQLScalarsMap,
      resolvers: AllResolvers,
      validate: false,
    }),

    context: ({ req, res }): GraphQLContextType => ({ dbConnection: DBContext.connection, req, res }),
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: {
      credentials: true,
      origin: ["https://studio.apollographql.com", "http://localhost:3000"],
    },
  });
  app.listen(4000, () => console.log("Server is up and running at 4000"));
};

main();
function ApolloServerPluginLandingPageGraphQLPlayground() {
  throw new Error("Function not implemented.");
}
