import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        message = resObj.message ?? exception.message;
        if (Array.isArray(resObj.message)) {
          message = 'Validation failed';
          errors = resObj.message;
        } else if (resObj.errors) {
          errors = resObj.errors;
        }
      }
    } else if (exception instanceof Error) {
      const err = exception as any;
      // Handle Google GenAI or third-party error formats safely
      if (err.status === 503 || (err.message && err.message.includes('503'))) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'The AI service is temporarily experiencing high demand. Please try again shortly.';
      } else if (err.status === 429 || (err.message && err.message.includes('429'))) {
        status = HttpStatus.TOO_MANY_REQUESTS;
        message = 'AI rate limit reached. Please wait a moment and try again.';
      } else if (err.status === 401 || err.status === 403) {
        status = HttpStatus.BAD_GATEWAY;
        message = 'AI authentication error. Please verify the server configuration.';
      } else {
        // Sanitize generic errors so secrets are never leaked
        message = err.message?.replace(/key=[^&\s]+/gi, 'key=REDACTED') ?? 'Internal server error';
      }
    }

    // Log the error securely without leaking secrets
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${
        exception instanceof Error ? exception.message : JSON.stringify(exception)
      }`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
