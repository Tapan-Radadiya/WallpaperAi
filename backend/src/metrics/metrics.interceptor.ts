import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';
import { register } from 'prom-client';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService
  ) { }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse()
    const { method, url, route } = request
    const reqStartTime = Date.now()

    return next
      .handle()
      .pipe(
        tap(async () => {
          const reqResTime = (Date.now() - reqStartTime) / 1000
          const status = response.statusCode;
          await this.metricsService.recordRequest(
            method,
            request.route?.path ?? url,
            status,
            reqResTime
          )
        })
      );
  }
}
