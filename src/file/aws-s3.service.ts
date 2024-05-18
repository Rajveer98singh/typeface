// aws-s3.service.ts

import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';

@Injectable()
export class AwsS3Service {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  async uploadFile(
    bucketName: string,
    fileKey: string,
    fileBody: Buffer,
  ): Promise<void> {
    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBody,
    };
    await this.s3.upload(params).promise();
  }

  async getFile(bucketName: string, fileKey: string): Promise<Buffer> {
    const params = {
      Bucket: bucketName,
      Key: fileKey,
    };
    const data = await this.s3.getObject(params).promise();
    return data.Body as Buffer;
  }

  async deleteFile(bucketName: string, fileKey: string): Promise<void> {
    const params = {
      Bucket: bucketName,
      Key: fileKey,
    };
    await this.s3.deleteObject(params).promise();
  }
}
