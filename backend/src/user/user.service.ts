import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { APIResponseInterface, UserDataType } from 'src/types/common.types';
import * as schema from "../Schema/schema"
import { APIResponse } from 'src/utils/common';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class UserService {
    constructor(
        @Inject(DRIZZLE) private readonly conn: NodePgDatabase<typeof schema>
    ) { }

    async registerUserService(userData: UserDataType): Promise<APIResponseInterface> {
        // Insert User Data
        const { avatar, displayName, emailId } = userData
        try {

            const userExists = await this.conn.query.tbl_user.findFirst({
                where: and(
                    eq(schema.tbl_user.display_name, userData.displayName),
                    eq(schema.tbl_user.email_id, userData.emailId)
                )
            })
            if (userExists) {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "User with this name or emailid already exists" })
            }
            const newUser = await this.conn.insert(schema.tbl_user).values({
                avatar,
                display_name: displayName,
                email_id: emailId
            })
            if (newUser) {
                return APIResponse({ statusCode: HttpStatus.OK, message: "user register successfully", data: newUser })
            } else {
                return APIResponse({ statusCode: HttpStatus.CONFLICT, message: "Error Creating User" })
            }
        } catch (error) {
            return APIResponse({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Error Registering User", err: error })
        }
    }
}
