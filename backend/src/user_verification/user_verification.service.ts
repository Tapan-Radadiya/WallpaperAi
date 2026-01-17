import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as schema from "../Schema/schema"
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomInt } from "crypto"
import { APIResponseInterface } from 'src/types/common.types';
import { eq } from 'drizzle-orm';
import { APIResponse } from 'src/utils/common';
import * as pug from "pug"
import { MailService } from 'src/mail/mail.service';
@Injectable()
export class UserVerificationService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>,
        private readonly mailService: MailService
    ) { }

    async sendVerificationEmailService(userId: string): Promise<APIResponseInterface> {
        try {
            const userData = await this.conn.query.tbl_user.findFirst({
                where: (
                    eq(schema.tbl_user.id, userId)
                )
            })

            if (userData) {
                const { email_id, display_name } = userData
                const verificationCode = randomInt(100000, 999999)
                const res = pug.renderFile('src/EmailTemplates/SignUpVerification.pug', {
                    username: display_name,
                    code: verificationCode,
                    year: new Date().getFullYear(),
                })
                this.mailService.sendEmail('User Verification', res, email_id)
            }
            return APIResponse({ statusCode: HttpStatus.OK, message: "" })
        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal Server Error" })
        }
    }
}
