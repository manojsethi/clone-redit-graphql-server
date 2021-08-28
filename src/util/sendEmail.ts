import nodemailer from "nodemailer";
import EnvironmentConfig from "./env.config";

const sendEmail = async (to: string[], subject: string, html: string): Promise<boolean> => {
  try {
    let transporter = nodemailer.createTransport({
      host: EnvironmentConfig.MAIL_HOST,
      port: EnvironmentConfig.MAIL_PORT,
      secure: EnvironmentConfig.IS_SECURE,
      auth: {
        user: EnvironmentConfig.MAIL_USERNAME,
        pass: EnvironmentConfig.MAIL_PASSWORD,
      },
    });

    let info = await transporter.sendMail({
      from: EnvironmentConfig.SENDER_ADDRESS,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export default sendEmail;
