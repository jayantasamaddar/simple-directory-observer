import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { log } from "./logger";
dotenv.config({ path: process.env.ENVPATH });

export interface EmailProps {
  name: string;
  senderName?: string;
  from?: string;
  to?: string;
  message: string;
  subject: string;
  host?: string;
  port?: number;
}

export const sendEmail = async ({
  name,
  senderName = process.env.EMAIL_SENDER,
  message,
  subject = "ALERT: Directory overload!",
  host = process.env.EMAIL_HOST,
  port = Number(process.env.EMAIL_PORT),
  from = process.env.EMAIL_FROM,
  to = process.env.EMAIL_TO,
}: EmailProps) => {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    const emailResponse = await transporter.sendMail({
      from: `${senderName || process.env.EMAIL_SENDER} via ${
        process.env.APP_NAME || "Simple Directory Observer"
      } <${from}>`,
      to: `${name} ${to}`,
      replyTo: `${name} <${to}>`,
      subject,
      text: message,
      html: `
      <style>
        p { white-space: pre-wrap }
      </style>
            <div>
                <h3>${subject}</h3><br />
                <p><strong>Name:</strong> ${name} </p>
                <p><strong>Email:</strong> ${to} </p><br/>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\\n/g, "</p><p>")}</p><br/>
            </div>`,
    });
    log("info", `Message sent: ${emailResponse.messageId}`);
  } catch (error) {
    if (error instanceof Error) {
      log("error", error.message);
    }
  }
};
