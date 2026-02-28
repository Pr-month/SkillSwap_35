import { Inject, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { mailConfig, TMailConfig } from 'src/config/mail.config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject(mailConfig.KEY)
    private readonly config: TMailConfig,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const { host, port, secure, auth } = this.config;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: auth.user,
        pass: auth.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.transporter.verify((error: Error | null) => {
      if (error) {
        console.log('Mail transporter verification failed:', error);
      } else {
        console.log('Mail transporter is ready to send messages');
      }
    });
  }

  private generateHtmlTemplate(text: string, subject: string): string {
    const { fromName } = this.config;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            font-size: 24px;
            margin: 0;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 16px;
            margin: 0;
            opacity: 0.9;
          }
          .content { 
            padding: 30px 20px; 
            background-color: #ffffff;
          }
          .content p {
            margin-bottom: 15px;
            color: #4a5568;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef;
            font-size: 14px; 
            color: #6c757d; 
          }
          .footer p {
            margin: 5px 0;
          }
          @media only screen and (max-width: 600px) {
            .container { margin: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${fromName}</h1>
            <p>${subject}</p>
          </div>
          <div class="content">
            ${text.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      const { from, fromName } = this.config;

      if (!to || !subject || !text) {
        throw new Error('Missing required fields: to, subject, or text');
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${fromName}" <${from}>`,
        to: to,
        subject: subject,
        text: text,
        html: html || this.generateHtmlTemplate(text, subject),
      };

      await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        message: `Email sent successfully to ${to}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        message: `Failed to send email: ${errorMessage}`,
      };
    }
  }
}
