import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoggingService } from './logging.service';

@Controller('logging')
export class LoggingController {
    constructor(
        private readonly loggingService: LoggingService
    ) { }


    @Get('/metrics/prometheus/logs')
    async getPrometheusLoggingData(
        @Req() req: Request,
        @Res() res: Response
    ) {
        const metrics = await this.loggingService.getMetrics()
        res.setHeader('Content-Type', 'text/plain')
        res.send(metrics)
    }
}
