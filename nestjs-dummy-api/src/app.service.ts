import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OpossumCircuitBreaker } from './opossum-circuit-breaker.service';
import { HttpService } from '@nestjs/axios';
import { SelfCircuitBreaker } from './self-circuit-breaker.service';

@Injectable()
export class AppService {
  breaker: SelfCircuitBreaker = null;
  circuitBreaker: OpossumCircuitBreaker = null;
  constructor(private http: HttpService) {
    this.http.axiosRef.interceptors.request.use((config) => {
      config.baseURL = 'http://localhost:3000';
      return config;
    });
    this.breaker = new SelfCircuitBreaker(this.http, {
      method: 'get',
      url: '/',
    });
    this.circuitBreaker = new OpossumCircuitBreaker(this.http, {
      method: 'get',
      url: '/',
    });
  }
  async getHello() {
    try {
      const result = await this.circuitBreaker.fire();
      return result;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.response || error.message,
        error.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }
  async action2() {
    try {
      const response = await this.breaker.fire();
      return response;
    } catch (error) {
      // console.error(error.message);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
