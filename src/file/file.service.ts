import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './file.entity';
import { AwsS3Service } from './aws-s3.service';
import * as fs from 'fs';

@Injectable()
export class FileService {
  private readonly filePath = './uploads'; // Define the local file path

  constructor(
    @InjectRepository(FileEntity)
    readonly fileRepository: Repository<FileEntity>,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    metadata: any,
    useS3: boolean,
    fileBuffer: Buffer,
  ): Promise<FileEntity> {
    const { originalname, size, mimetype } = file;

    // Create a new FileEntity instance
    const fileEntity = this.fileRepository.create({
      fileName: originalname,
      createdAt: new Date(),
      size,
      fileType: mimetype,
      ...metadata,
    }) as unknown as FileEntity;

    // Verify that fileEntity is a single entity
    if (Array.isArray(fileEntity)) {
      throw new Error('Expected a single FileEntity, but received an array');
    }

    console.log('Created FileEntity:', fileEntity);

    // Save the FileEntity instance
    const savedFileEntity = await this.fileRepository.save(fileEntity);

    // Check the type of savedFileEntity (for debugging purposes)
    console.log('Saved FileEntity:', savedFileEntity);

    console.log(fileBuffer);
    if (!fileBuffer) {
      throw new Error('File buffer is undefined');
    }

    if (useS3) {
      await this.awsS3Service.uploadFile(
        'your-bucket-name',
        savedFileEntity.id.toString(),
        fileBuffer,
      );
    } else {
      // Ensure the directory exists
      if (!fs.existsSync(this.filePath)) {
        fs.mkdirSync(this.filePath, { recursive: true });
      }

      // Save file to local system
      fs.writeFileSync(
        `${this.filePath}/${savedFileEntity.id.toString()}`,
        fileBuffer,
      );
    }

    return savedFileEntity;
  }

  async getFile(fileId: number): Promise<Buffer> {
    const fileEntity = await this.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!fileEntity) {
      throw new Error('File not found');
    }

    const useS3 = false; // Adjust this based on your logic or configuration

    if (useS3) {
      return await this.awsS3Service.getFile(
        'your-bucket-name',
        fileEntity.id.toString(),
      );
    } else {
      const filePath = `${this.filePath}/${fileEntity.id.toString()}`;
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found on the local file system');
      }
      return fs.readFileSync(filePath);
    }
  }

  async updateFile(
    fileId: number,
    file: Express.Multer.File,
    metadata: any,
    useS3: boolean,
  ): Promise<FileEntity> {
    const fileEntity = await this.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!fileEntity) {
      throw new Error('File not found');
    }

    const { originalname, size, mimetype } = file;

    fileEntity.fileName = originalname;
    fileEntity.size = size;
    fileEntity.fileType = mimetype;
    Object.assign(fileEntity, metadata);

    const updatedFileEntity = await this.fileRepository.save(fileEntity);

    if (!file.buffer) {
      throw new Error('File buffer is undefined');
    }

    if (useS3) {
      await this.awsS3Service.uploadFile(
        'your-bucket-name',
        updatedFileEntity.id.toString(),
        file.buffer,
      );
    } else {
      if (!fs.existsSync(this.filePath)) {
        fs.mkdirSync(this.filePath, { recursive: true });
      }

      fs.writeFileSync(
        `${this.filePath}/${updatedFileEntity.id.toString()}`,
        file.buffer,
      );
    }

    return updatedFileEntity;
  }

  async deleteFile(fileId: number): Promise<void> {
    const fileEntity = await this.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!fileEntity) {
      throw new Error('File not found');
    }

    const useS3 = false; // Adjust this based on your logic or configuration

    if (useS3) {
      await this.awsS3Service.deleteFile(
        'your-bucket-name',
        fileEntity.id.toString(),
      );
    } else {
      const filePath = `${this.filePath}/${fileEntity.id.toString()}`;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.fileRepository.remove(fileEntity);
  }

  async getFiles(): Promise<FileEntity[]> {
    return await this.fileRepository.find();
  }
  
}
