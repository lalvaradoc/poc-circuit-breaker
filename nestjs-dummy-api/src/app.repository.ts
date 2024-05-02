import { HttpService } from '@nestjs/axios';
import { CircuitBreaker } from './circuit-breaker.decorator';
import { catchError, firstValueFrom, map } from 'rxjs';
import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class AppRepository {
  constructor(private http: HttpService) {
    this.http.axiosRef.interceptors.request.use((config) => {
      config.baseURL = 'http://localhost:3000';
      return config;
    });
  }
  @CircuitBreaker()
  async getHello(): Promise<any> {
    const response = await firstValueFrom(
      this.http.get('/').pipe(
        catchError((error) => {
          throw new HttpException(
            error.response ? error.response.data : 'Internal Server Error',
            error.response ? error.response.status : 500,
          );
        }),
        map((response) => response.data),
      ),
    );
    return response;
  }
}
