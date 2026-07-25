// src/modules/chat/services/attachment.service.ts
import { AppException } from '@common/exceptions/app.exception';
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class AttachmentService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<{ objectKey: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'chat', resource_type: 'auto' },
        (error, result) => {
          if (error || !result) {
            reject(AppException.internal('Failed to upload file or result undefined'));
          } else {
            // objectKey chính là public_id (bao gồm folder)
            resolve({ objectKey: result.public_id });
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }
}
