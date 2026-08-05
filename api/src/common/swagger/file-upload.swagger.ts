import { ApiBody } from '@nestjs/swagger';

export function ApiFileUploadBody(required = true) {
  return ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      ...(required ? { required: ['file'] } : {}),
    },
  });
}
