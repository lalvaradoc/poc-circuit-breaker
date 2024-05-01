import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { catchError, firstValueFrom, map } from 'rxjs';

const CircuitBreakerStates = {
  OPENED: 'OPENED',
  CLOSED: 'CLOSED',
  HALF: 'HALF',
};
type RequestConfig = {
  url: string;
  method: string;
  data?: Object;
};

@Injectable()
export class SelfCircuitBreaker {
  request = null;
  state = CircuitBreakerStates.CLOSED;
  failureCount = 0;
  failureThreshold = 5;
  resetAfter = 50000;
  timeout = 5000;
  http: HttpService = null;
  requestConfig: RequestConfig = null;

  constructor(http: HttpService, requestConfig: RequestConfig, options?: any) {
    this.http = http;
    this.requestConfig = requestConfig;
    this.state = CircuitBreakerStates.CLOSED;
    this.failureCount = 0;
    this.resetAfter = Date.now();
    if (options) {
      this.failureThreshold = options.failureThreshold;
      this.timeout = options.timeout;
    } else {
      this.failureThreshold = 5;
      this.timeout = 5000;
    }
  }

  private action<T>() {
    return new Promise(async (resolve, reject) => {
      try {
        const response = firstValueFrom(
          this.http.request<T>(this.requestConfig).pipe(
            catchError((error) => {
              throw new Error(error);
            }),
            map((response) => response.data),
          ),
        );
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  }

  async fire<T>() {
    if (this.state === CircuitBreakerStates.OPENED) {
      if (this.resetAfter <= Date.now()) {
        this.state = CircuitBreakerStates.HALF;
      } else {
        throw new Error(
          'Service unavailable right now. Please try again later.',
        );
      }
    }
    try {
      const response = await await this.action<T>();
      return this.success(response);
    } catch (err) {
      return this.failure(err.message);
    }
  }

  private success(data) {
    this.failureCount = 0;
    if (this.state === CircuitBreakerStates.HALF) {
      this.state = CircuitBreakerStates.CLOSED;
    }
    return data;
  }

  private failure(data) {
    this.failureCount += 1;
    console.log(this.failureCount);
    if (
      this.state === CircuitBreakerStates.HALF ||
      this.failureCount >= this.failureThreshold
    ) {
      this.state = CircuitBreakerStates.OPENED;
      this.resetAfter = Date.now() + this.timeout;
    }
    return data;
  }
}
