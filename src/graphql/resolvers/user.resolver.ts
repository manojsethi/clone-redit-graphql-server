import argon2 from "argon2";
import { Session } from "express-session";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { User } from "../../db/entities/user.entity";
import { GraphQLContextType } from "../graphql_context_type";

declare module "express-session" {
  interface SessionData {
    userid: number;
  }
}
@InputType()
class UsernamePasswordInput {
  @Field(() => String, { description: "Username of the user. Must be a unique" })
  username: string;
  @Field(() => String, { description: "Password of the user." })
  password: string;
}

@InputType()
class RegisterInput {
  @Field(() => String, { description: "Username of the user. Must be a unique" })
  username: string;
  @Field(() => String, { description: "Username of the user. Must be a unique" })
  email: string;
  @Field(() => String, { description: "Password of the user." })
  password: string;
}

@ObjectType()
class FieldError {
  @Field(() => String)
  field: string;
  @Field(() => String)
  message: string;
}
@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}
@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, dbConnection }: GraphQLContextType): Promise<User | null | undefined> {
    if (!req.session.userid) return null;
    else return await dbConnection.getRepository(User).findOne({ id: req.session.userid });
  }
  @Mutation(() => UserResponse, { description: "Register a new user with a unique username." })
  async register(@Arg("auth_data", () => RegisterInput) auth_data: RegisterInput, @Ctx() { dbConnection, req }: GraphQLContextType): Promise<UserResponse> {
    const hashedPassword = await argon2.hash(auth_data.password);
    let existingUser = await dbConnection.getRepository(User).findOne({ where: [{ username: auth_data.username.toLowerCase() }, { email: auth_data.email.toLowerCase() }] });
    if (!existingUser) {
      let user = await dbConnection.getRepository(User).save({ email: auth_data.email.toLowerCase(), username: auth_data.username.toLowerCase(), password: hashedPassword } as User);
      req.session.userid = user.id;
      return { user };
    } else {
      if (existingUser.username === auth_data.username.toLowerCase()) return { errors: [{ field: "username", message: "username already taken" }] };
      else return { errors: [{ field: "email", message: "email already taken" }] };
    }
  }

  @Query(() => UserResponse, { description: "Login a user." })
  async login(@Arg("auth_data", () => UsernamePasswordInput) auth_data: UsernamePasswordInput, @Ctx() { dbConnection, req }: GraphQLContextType): Promise<UserResponse> {
    let user = await dbConnection.getRepository(User).findOne({ where: [{ username: auth_data.username.toLowerCase() }, { email: auth_data.username.toLowerCase() }] });
    if (!user) {
      return {
        errors: [{ field: "username", message: "Username doesn't exist." }] as FieldError[],
      };
    }
    const valid = await argon2.verify(user.password, auth_data.password);
    if (valid) {
      req.session.userid = user.id;
      return {
        user,
      };
    } else
      return {
        errors: [{ field: "password", message: "Invalid Password and Username combination." }] as FieldError[],
      };
  }

  @Query(() => Boolean, { description: "Logs out the user." })
  logout(@Ctx() { req, res }: GraphQLContextType): Promise<Boolean> {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        res.clearCookie("qid");
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }
}
