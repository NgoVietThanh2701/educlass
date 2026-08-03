import { AppException } from '@common/exceptions/app.exception';
import { Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import {
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_IMAGE_MIME_TYPES,
  UPLOAD_MAX_FILE_SIZE,
} from '@common/constants/upload.constant';

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
    folder = 'uploads',
    allowedMimeTypes: Set<string> = UPLOAD_ALLOWED_MIME_TYPES,
  ): Promise<{
    objectKey: string;
    url?: string;
    resourceType?: string;
  }> {
    this.validateFile(file, allowedMimeTypes);

    return new Promise<{ objectKey: string; url: string; resourceType: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'auto' },
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

  async uploadImage(file: Express.Multer.File, folder = 'course-thumbnails') {
    return this.uploadFile(file, folder, UPLOAD_IMAGE_MIME_TYPES);
  }

  private validateFile(file: Express.Multer.File, allowedMimeTypes: Set<string>) {
    if (!file || !file.buffer) {
      throw AppException.badRequest('No file provided');
    }

    if (file.size > UPLOAD_MAX_FILE_SIZE) {
      throw AppException.badRequest('File size exceeds allowed limit');
    }

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw AppException.badRequest('File type is not allowed');
    }
  }
}
