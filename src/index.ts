import express from "express";
import Redis from "ioredis";
import "reflect-metadata";
import DBContext from "./db/DBContext";
import apolloSetup from "./startup/apolloSetup";
import setupRedisSession from "./startup/setupRedisSession";
const main = async () => {
  await DBContext.createDBConnection();
  const app = express();
  const redisClient = new Redis();
  setupRedisSession(app, redisClient);
  await apolloSetup(app, redisClient);

  app.listen(4000, () => console.log("Server is up and running at 4000"));
};
main();
