import { Injectable } from '@nestjs/common';
import { OpossumCircuitBreaker } from './opossum-circuit-breaker.service';
import { HttpService } from '@nestjs/axios';
import { AppRepository } from './app.repository';

@Injectable()
export class AppService {
  circuitBreaker: OpossumCircuitBreaker = null;
  constructor(
    private http: HttpService,
    private appRepository: AppRepository,
  ) {
    this.http.axiosRef.interceptors.request.use((config) => {
      config.baseURL = 'http://localhost:3000';
      return config;
    });
  }
  async getHello() {
    return await this.appRepository.getHello();
  }
}
