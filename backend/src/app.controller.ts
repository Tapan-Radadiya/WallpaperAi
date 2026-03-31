import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('test')
  getHello(
    @Req() req: Request,
    @Res() res: Response
  ) {
    return res.status(500).json({ data: "Internal Server Error" })
  }
}
