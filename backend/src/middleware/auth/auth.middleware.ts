import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { APIResponse } from '@src/utils/common';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {

    if (!req.session.userId || !req.session.useremail) {
      return res.status(HttpStatus.UNAUTHORIZED).json(APIResponse({ statusCode: HttpStatus.UNAUTHORIZED, message: "Please login" }))
    }
    next();
  }
}
