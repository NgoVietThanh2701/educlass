import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(status: HttpStatus, code: string, message: string) {
    super(
      {
        status,
        code,
        message,
      },
      status,
    );
  }
}
