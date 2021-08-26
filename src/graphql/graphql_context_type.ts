import { Request, Response } from "express";
import { Connection } from "typeorm";

export type GraphQLContextType = {
  dbConnection: Connection;
  req: Request;
  res: Response;
};
