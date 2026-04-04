import { ConsoleLogger, Injectable } from '@nestjs/common';
import { createLogger, format } from 'winston';
import LokiTransport from 'winston-loki';

@Injectable()
export class LoggingService extends ConsoleLogger {

    private readonly logger = createLogger({
        level: 'error',
        format: format.combine(
            format.json(),
            format.timestamp()
        ),
        transports: [
            new LokiTransport({
                host: process.env.LOKI_TRANSPORT_URL!,
                labels: { job: "wallpaper_backend" },
                json: false,
                onConnectionError: (err) => {
                    console.error('Loki error:', err);
                }
            })
        ]
    })

    error(message: string, context?: any) {
        this.logger.error(message, { context })
    }

    warn(message: string, context?: any) {
        this.logger.error(message, { context })
    }

    info(message: string, context?: any) {
        this.logger.info(message, { context })
    }
}
