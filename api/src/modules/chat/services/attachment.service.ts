// src/modules/chat/services/attachment.service.ts
import { AppException } from '@common/exceptions/app.exception';
import { Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { CHAT_ALLOWED_MIME_TYPES, CHAT_MAX_UPLOAD_SIZE } from '../chat.constants';

@Injectable()
export class AttachmentService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ objectKey: string; url?: string; resourceType?: string }> {
    // Basic validations: ensure file present, size and mime type
    if (!file || !file.buffer) {
      throw AppException.badRequest('No file provided');
    }

    if (file.size > CHAT_MAX_UPLOAD_SIZE) {
      throw AppException.badRequest('File size exceeds allowed limit');
    }

    if (!CHAT_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw AppException.badRequest('File type is not allowed');
    }

    return new Promise<{ objectKey: string; url: string; resourceType: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'chat', resource_type: 'auto' },
          (error, result: UploadApiResponse | undefined) => {
            if (error || !result) {
              reject(AppException.internal('Failed to upload file or result undefined'));
            } else {
              resolve({
                objectKey: result.public_id,
                url: result.secure_url,
                resourceType: result.resource_type,
              });
            }
          },
        );
        uploadStream.end(file.buffer);
      },
    );
  }
}
