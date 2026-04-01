import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class LoggingService extends ConsoleLogger {
    private static lokiURL = process.env.LOKI_URL
}
