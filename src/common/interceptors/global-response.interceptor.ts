import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseHandler } from '../utils/response-handler';

@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          (data.statusCode || data.message || data.meta)
        ) {
          // Ya es un ResponseHandler: no lo tocamos
          return data;
        }

        return ResponseHandler.ok('Request successful', data);
      }),
    );
  }
}
