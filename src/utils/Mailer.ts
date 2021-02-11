import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

class Mailer {
  private static mailerTransporter: Mail;

  static async sendEmail(emailData: EmailData): Promise<void> {
    if (!Mailer.mailerTransporter) {
      Mailer.mailerTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_ADDRESS,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }

    // send the mail with given data
    const mailObj: { [key: string]: string } = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
    };

    // add body to mailObject
    mailObj[emailData.isHtml ? "html" : "text"] = emailData.body;

    await Mailer.mailerTransporter.sendMail(mailObj);
  }

  static generatePasswordResetEmailObj(to: string, token: string) {
    return {
      from: `"Natours 🌏" <${process.env.EMAIL_ADDRESS}>`,
      to: to,
      subject: "Password reset request 👨‍💻",
      body: `<p>Hi,</p>
            <p>&nbsp;</p>
            <p>We received a request to reset the password of your account. If you didn't make the request please ignore this email. Otherwise, please visit the below link to change your email password.</p>
            <p>&nbsp;</p>
            <p style="text-align: center;"><a href="http://127.0.0.1:3000/api/v1/auth/reset-password?reset=${token}" target="_blank" rel="noopener">Reset Password</a></p>
            <p style="text-align: center;">&nbsp;</p>
            <p style="text-align: left;">or open this URL in your browser: http://127.0.0.1:3000/api/v1/auth/reset-password?reset=${token}</p>
            <p>&nbsp;</p>
            <p>Cheers,</p>
            <p>Natours Team.</p>`,
      isHtml: true,
    };
  }
}

export default Mailer;
