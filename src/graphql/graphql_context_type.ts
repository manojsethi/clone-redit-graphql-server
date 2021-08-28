import { Request, Response } from "express";
import { Redis } from "ioredis";
import { Connection } from "typeorm";

export type GraphQLContextType = {
  dbConnection: Connection;
  req: Request;
  res: Response;
  redis: Redis;
};
