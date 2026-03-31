import { Module } from '@nestjs/common';
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { } from "prom-client";
import { MetricsService } from './metrics.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsInterceptor } from './metrics.interceptor';
@Module({
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total Number Of Requests',
      labelNames: ['method', 'route', 'status']
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: "Life cycle time for a particular req-res",
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.3, 0.5, 1, 2, 5]
    }),
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor
    }
  ],
  exports: [MetricsService]
})
export class MetricsModule { }
