import { HttpException, HttpStatus } from '@nestjs/common';
import OpossumCircuitBreaker from 'opossum';

export type CircuitBreakerOptionsType = {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
};

export type CircuitBreakerConfig = {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
};

export const breakerOptions = {
  timeout: 3000,
  errorThresholdPercentage: 10,
  resetTimeout: 15000,
  errorFilter: (err) => {
    const status = parseInt(err.status, 10);
    if (status < 500) {
      return true;
    }
    return false;
  },
};

export const CircuitBreaker = (
  circuitBreakerConfig?: CircuitBreakerConfig,
): any => {
  return (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    return {
      get() {
        const breaker = new OpossumCircuitBreaker(descriptor.value.bind(this), {
          ...breakerOptions,
          ...circuitBreakerConfig,
        });

        const wrapperFn = async (...args: any[]) => {
          return breaker
            .fire(...args)
            .then((res) => res)
            .catch((err) => {
              console.log(
                `Circuit breaker failed for request ${descriptor.value}`,
                err,
              );
              throw new HttpException(
                err.message,
                err.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            });
        };

        Object.defineProperty(this, propertyKey, {
          ...descriptor,
          value: wrapperFn,
        });
        return wrapperFn;
      },
    };
  };
};
