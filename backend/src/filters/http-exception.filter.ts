import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface StandardErrorResponse {
  error_code: string;
  message: string;
  details: any;
  request_id: string;
  timestamp: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const requestId = uuidv4();

    const errorResponse: StandardErrorResponse = {
      error_code: this.getErrorCode(status),
      message: exception.message,
      details: this.getErrorDetails(exception),
      request_id: requestId,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      default:
        return `HTTP_${status}`;
    }
  }

  private getErrorDetails(exception: HttpException): any {
    const response = exception.getResponse();
    
    if (typeof response === 'string') {
      return null;
    }

    if (typeof response === 'object' && response !== null) {
      const responseObj = response as any;
      
      if (responseObj.message) {
        return responseObj.message;
      }
    }

    return null;
  }
}
