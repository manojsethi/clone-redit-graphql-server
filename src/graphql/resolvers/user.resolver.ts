import argon2 from "argon2";
import fs from "fs";
import path from "path";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../db/entities/user.entity";
import CONSTANTS from "../../util/constants";
import EnvironmentConfig from "../../util/env.config";
import sendEmail from "../../util/sendEmail";
import { GraphQLContextType } from "../graphql_context_type";
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
  @Query(() => Boolean)
  async validateForgotPasswordToken(@Arg("token", () => String) token: string, @Ctx() { redis }: GraphQLContextType): Promise<Boolean> {
    const key = CONSTANTS.FORGOT_PASSWORD_REDIS_KEY + token;
    const userId = await redis.get(key);
    if (!userId) return false;
    else return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token", () => String) token: string,
    @Arg("newPassword", () => String) newPassword: string,
    @Ctx() { redis, dbConnection, req }: GraphQLContextType
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ],
      };
    }

    const key = CONSTANTS.FORGOT_PASSWORD_REDIS_KEY + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const user = await dbConnection.getRepository(User).findOne({ id: parseInt(userId) });

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    user.password = await argon2.hash(newPassword);
    await dbConnection.getRepository(User).update({ id: parseInt(userId) }, user);
    await redis.del(key);
    req.session.userid = user.id;
    return { user };
  }
  @Mutation(() => Boolean, { nullable: false })
  async forgotPassword(@Arg("email", () => String) email: String, @Ctx() { dbConnection, redis }: GraphQLContextType) {
    let existingUser = await dbConnection.getRepository(User).findOne({ email: email.toLowerCase() });
    if (existingUser) {
      let messageTemplate = fs.readFileSync(path.resolve("src/email-templates/forgot-password.html"), { encoding: "utf-8" });
      let passwordKey = uuidv4();
      let resetUrl = `http://localhost:3000/change-password/${passwordKey}`;
      messageTemplate = messageTemplate.replace("[RESET_PASSWORD_URL]", resetUrl);
      redis.set(`${CONSTANTS.FORGOT_PASSWORD_REDIS_KEY}${passwordKey}`, existingUser.id, "ex", 1000 * 60 * 60 * 2); //2 Hours
      sendEmail([email.toString()], "Forgot Password - Reddit Clone", messageTemplate);
      return true;
    }
    return true;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, dbConnection }: GraphQLContextType): Promise<User | null | undefined> {
    if (!req.session.userid) return null;
    else return await dbConnection.getRepository(User).findOne({ id: req.session.userid });
  }
  @Mutation(() => UserResponse, { description: "Register a new user with a unique username." })
  async register(
    @Arg("auth_data", () => RegisterInput) auth_data: RegisterInput,
    @Ctx() { dbConnection, req }: GraphQLContextType
  ): Promise<UserResponse> {
    const hashedPassword = await argon2.hash(auth_data.password);
    let existingUser = await dbConnection
      .getRepository(User)
      .findOne({ where: [{ username: auth_data.username.toLowerCase() }, { email: auth_data.email.toLowerCase() }] });
    if (!existingUser) {
      let user = await dbConnection
        .getRepository(User)
        .save({ email: auth_data.email.toLowerCase(), username: auth_data.username.toLowerCase(), password: hashedPassword } as User);
      req.session.userid = user.id;
      return { user };
    } else {
      if (existingUser.username === auth_data.username.toLowerCase()) return { errors: [{ field: "username", message: "username already taken" }] };
      else return { errors: [{ field: "email", message: "email already taken" }] };
    }
  }

  @Query(() => UserResponse, { description: "Login a user." })
  async login(
    @Arg("auth_data", () => UsernamePasswordInput) auth_data: UsernamePasswordInput,
    @Ctx() { dbConnection, req }: GraphQLContextType
  ): Promise<UserResponse> {
    let user = await dbConnection
      .getRepository(User)
      .findOne({ where: [{ username: auth_data.username.toLowerCase() }, { email: auth_data.username.toLowerCase() }] });
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
        res.clearCookie(EnvironmentConfig.COOKIE_NAME);
        if (err) {
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }
}
