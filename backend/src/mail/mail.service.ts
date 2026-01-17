import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly mailerService: MailerService
    ) { }

    async sendEmail(
        subject: string,
        template: string,
        to: string
    ) {
        try {
            const toSendEmails = process.env.TO_EMAILS?.split(',')
            if (!toSendEmails?.includes(to)) {
                this.logger.log("Receiver Not Exists")
                return
            }
            const sendEmailparams = {
                to,
                from: process.env.SMTP_USER,
                subject,
                template: 'SignUpVerification.pug'
            }

            console.log('sendEmailparams-->', sendEmailparams);
            const response = await this.mailerService.sendMail(sendEmailparams)
            this.logger.log("Email Sent Successfully", response)
        } catch (error) {
            console.log('error-->', error);
            this.logger.log("Error Sending Email")
        }
    }
}
