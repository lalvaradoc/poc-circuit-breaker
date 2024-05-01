import { HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import CircuitBreaker from 'opossum';
import { catchError, firstValueFrom, map } from 'rxjs';

type RequestConfig = {
  url: string;
  method: string;
  data?: Object;
};

@Injectable()
export class OpossumCircuitBreaker {
  public breaker: CircuitBreaker = null;
  options: CircuitBreaker.Options = {
    timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 5, // When 50% of requests fail, trip the circuit
    resetTimeout: 30000, // After 30 seconds, try again..
    errorFilter: (err) => {
      const status = parseInt(err.status, 10);
      //   I want the circuit breaker to open only when the error status is 500
      if (status < 500) {
        return true;
      }
      return false;
    },
  };

  constructor(
    private http: HttpService,
    private requestConfig: RequestConfig,
  ) {
    this.create();
  }
  private action = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = firstValueFrom(
          this.http.request(this.requestConfig).pipe(
            map((response) => response.data),
            catchError((error) => {
              throw new HttpException(
                error.response ? error.response.data : 'Internal Server Error',
                error.response ? error.response.status : 500,
              );
            }),
          ),
        );
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };

  private create = () => {
    this.breaker = new CircuitBreaker(this.action, this.options);
  };

  fire = () => {
    return this.breaker.fire();
  };
}
