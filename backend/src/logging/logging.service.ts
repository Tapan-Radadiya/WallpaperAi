import { Injectable } from '@nestjs/common';
import * as client from "prom-client"

@Injectable()
export class LoggingService {
    private readonly register: client.Registry

    constructor() {
        this.register = new client.Registry()
        this.register.setDefaultLabels({ app: 'backend-wallpaper' })
        client.collectDefaultMetrics({ register: this.register })
    }

    async getMetrics(): Promise<string> {
        return this.register.metrics()
    }
}
