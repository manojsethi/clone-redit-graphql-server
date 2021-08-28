import * as dotenv from "dotenv";
dotenv.config();
var { parsed } = dotenv.config();

interface IEnvironmentConfig {
  MAIL_USERNAME: string;
  MAIL_PASSWORD: string;
  SENDER_ADDRESS: string;
  MAIL_HOST: string;
  MAIL_PORT: number;
  IS_SECURE: boolean;
  IS_TLS: boolean;

  COOKIE_SECRET: string;
  COOKIE_NAME: string;
}

var EnvironmentConfig: IEnvironmentConfig = <IEnvironmentConfig>(parsed as any);

export default EnvironmentConfig;
