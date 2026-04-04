import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { LoggingService } from "@src/logging/logging.service";

@Catch()
export class GlobalExceptionHandler implements ExceptionFilter {
    constructor(
        private readonly HttpAdapterHost: HttpAdapterHost,
        private readonly loggerService: LoggingService
    ) { }

    catch(exception: any, host: ArgumentsHost) {

        const { httpAdapter } = this.HttpAdapterHost

        const ctx = host.switchToHttp()

        const httpStatus = exception instanceof HttpException
            ? exception.getStatus() :
            HttpStatus.INTERNAL_SERVER_ERROR

        const responseBody = {
            httpStatus,
            timeStamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest())
        }

        // Log Error For Loki
        this.loggerService.error(JSON.stringify(responseBody))

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus)
    }
}