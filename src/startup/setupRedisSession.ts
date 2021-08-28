import connectRedis from "connect-redis";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import EnvironmentConfig from "../util/env.config";

const setupRedisSession = (app: express.Express, redisClient: Redis.Redis) => {
  const RedisStore = connectRedis(session);

  app.use(
    session({
      name: EnvironmentConfig.COOKIE_NAME,
      saveUninitialized: false,
      secret: EnvironmentConfig.COOKIE_SECRET,
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
};

export default setupRedisSession;
