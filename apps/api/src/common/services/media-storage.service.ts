import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MediaStorageService {
  private readonly logger = new Logger(MediaStorageService.name);
  private cloudinaryReady = false;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.cloudinaryReady = true;
    }
  }

  isCloudinaryConfigured(): boolean {
    return this.cloudinaryReady;
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const folder =
      this.configService.get<string>('CLOUDINARY_AVATAR_FOLDER') ?? 'kop/avatars';
    return this.uploadImage(userId, file, 'avatars', folder);
  }

  async uploadMembershipCard(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const folder =
      this.configService.get<string>('CLOUDINARY_CARD_FOLDER') ?? 'kop/cards';
    return this.uploadImage(userId, file, 'cards', folder);
  }

  async uploadNewsletterImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const folder =
      this.configService.get<string>('CLOUDINARY_NEWSLETTER_FOLDER') ?? 'kop/newsletter';
    return this.uploadImage(userId, file, 'newsletter', folder);
  }

  async uploadNewsletterPdf(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const folder =
      this.configService.get<string>('CLOUDINARY_NEWSLETTER_FOLDER') ?? 'kop/newsletter';

    if (this.cloudinaryReady) {
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: `issue-${userId}-${Date.now()}`,
            resource_type: 'raw',
            format: 'pdf',
            overwrite: true,
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(error ?? new Error('Cloudinary upload failed'));
              return;
            }
            resolve(uploadResult as { secure_url: string });
          },
        );
        stream.end(file.buffer);
      });
      this.logger.log(`Newsletter PDF uploaded to Cloudinary for user ${userId}`);
      return result.secure_url;
    }

    return this.uploadLocally(userId, file, 'newsletters');
  }

  private async uploadImage(
    userId: string,
    file: Express.Multer.File,
    localFolder: string,
    cloudFolder: string,
  ): Promise<string> {
    if (this.cloudinaryReady) {
      return this.uploadToCloudinary(userId, file, cloudFolder);
    }

    return this.uploadLocally(userId, file, localFolder);
  }

  private async uploadToCloudinary(
    userId: string,
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${userId}-${Date.now()}`,
          resource_type: 'image',
          overwrite: true,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve(uploadResult as { secure_url: string });
        },
      );
      stream.end(file.buffer);
    });

    this.logger.log(`Image uploaded to Cloudinary for user ${userId}`);
    return result.secure_url;
  }

  private uploadLocally(
    userId: string,
    file: Express.Multer.File,
    folder: string,
  ): string {
    const uploadsDir = join(process.cwd(), 'uploads', folder);
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    const extension = file.originalname.split('.').pop() ?? 'jpg';
    const filename = `${userId}-${Date.now()}.${extension}`;
    writeFileSync(join(uploadsDir, filename), file.buffer);

    const apiUrl = this.configService.get<string>('API_URL') ?? 'http://localhost:3000';
    this.logger.log(`Image stored locally for user ${userId}`);
    return `${apiUrl}/uploads/${folder}/${filename}`;
  }
}
