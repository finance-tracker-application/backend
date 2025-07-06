import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // correct way to use Gmail with nodemailer
  auth: {
    user: process.env.gmailUser,
    pass: process.env.gmailPassword,
  },
});

const sendEmail = async (toEmail, subject, htmlBody) => {
  await transporter.sendMail({
    from: "no-reply-gmail@gmail.com", // sender address
    to: toEmail, // list of receivers
    subject: subject,
    html: htmlBody, // html body
  });
};

export default sendEmail;
