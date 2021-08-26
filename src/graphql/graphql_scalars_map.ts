import { GraphQLDateTime } from "graphql-scalars";
import { ScalarsTypeMap } from "type-graphql/dist/schema/build-context";

export const graphQLScalarsMap: ScalarsTypeMap[] = [
  {
    scalar: GraphQLDateTime,
    type: Date,
  },
];
