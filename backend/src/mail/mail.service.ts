import { MailerService } from '@nestjs-modules/mailer';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { APIResponseInterface } from '@src/types/common.types';
import { APIResponse } from '@src/utils/common';
import { MailtrapClient } from "mailtrap"
@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    constructor(
        private readonly mailerService: MailerService
    ) { }

    async sendEmail(
        subject: string,
        template: string,
        to: string,
        context?: Record<string, string | number | Date>
    ) {
        try {

            // Dont check this condition on prod
            if (process.env.NODE_ENV === 'DEV') {
                const toSendEmails = process.env.TO_EMAILS?.split(',')
                if (!toSendEmails?.includes(to)) {
                    this.logger.log("Receiver Not Exists")
                    return
                }
            }

            const sendEmailparams = {
                to,
                from: process.env.SMTP_USER,
                subject,
                template,
                context
            }

            const response = await this.mailerService.sendMail({ ...sendEmailparams })
            this.logger.log("Email Sent Successfully", response)

        } catch (error) {
            console.log('error-->', error);
            this.logger.log("Error Sending Email")
        }
    }

    async sendTestEmail(): Promise<APIResponseInterface> {
        try {
            const sendEmailparams = {
                to: process.env.SMTP_USER,
                from: process.env.SMTP_USER,
                subject: 'Test Email',
                template: './TestEmail.pug',
                context: {
                    name: 'Test'
                }
            }

            const response = await this.mailerService.sendMail({ ...sendEmailparams })
            this.logger.log("Email Sent Successfully", response)
            return APIResponse({
                message: "Test Email Sent",
                statusCode: HttpStatus.OK
            })

        } catch (error) {
            console.log("error-->", error)
            return APIResponse({
                message: "Error Sending Test Email",
                statusCode: HttpStatus.BAD_REQUEST
            })
        }
    }
}
