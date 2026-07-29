import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodeType } from './error-codes.exception';

export class AppException extends HttpException {
  constructor(status: HttpStatus, code: string, message: string) {
    super(
      {
        code,
        message,
      },
      status,
    );
  }

  static wsException(message: string, code: ErrorCodeType = ErrorCode.WS_EXCEPTION): AppException {
    return new AppException(HttpStatus.BAD_REQUEST, code, message);
  }

  static badRequest(message: string, code: ErrorCodeType = ErrorCode.BAD_REQUEST): AppException {
    return new AppException(HttpStatus.BAD_REQUEST, code, message);
  }

  static unauthorized(message: string, code: ErrorCodeType = ErrorCode.UNAUTHORIZED): AppException {
    return new AppException(HttpStatus.UNAUTHORIZED, code, message);
  }

  static forbidden(message: string, code: ErrorCodeType = ErrorCode.FORBIDDEN): AppException {
    return new AppException(HttpStatus.FORBIDDEN, code, message);
  }

  static notFound(message: string, code: ErrorCodeType = ErrorCode.NOT_FOUND): AppException {
    return new AppException(HttpStatus.NOT_FOUND, code, message);
  }

  static conflict(message: string, code: ErrorCodeType = ErrorCode.CONFLICT): AppException {
    return new AppException(HttpStatus.CONFLICT, code, message);
  }

  static internal(message: string): AppException {
    return new AppException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR,
      message,
    );
  }
}
