import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from "prom-client"
@Injectable()
export class MetricsService {
    constructor(
        @InjectMetric('http_requests_total') public counter: Counter<string>,
        @InjectMetric('http_request_duration_seconds') public duration: Histogram<string>
    ) { }

    async recordRequest(method, route, status, duration) {
        if (typeof duration !== 'number') {
            return
        }
        this.counter.inc({
            method,
            route,
            status: status.toString()
        })

        this.duration.observe(
            { method, route, status: status.toString() },
            duration
        )
    }
}
