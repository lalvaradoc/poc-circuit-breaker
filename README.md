## A POC for Circuit Breaker with Opossum and NestJS

opossum: https://nodeshift.dev/opossum/

### express-dummy-api

API con express que simula una llamada con status 200 y 404

### nestjs-dummy-api

API con NestJS en donde se implementa el uso del circuit breaker y consume el api de `express-dummy-api`

Instalar opossum en el proyecto de NestJS

```
npm i --save opossum @types/opossum
```

agregar decorador a nivel repositorio

```js
@CircuitBreaker()
async getHello(){
    ...promise here
}
```
