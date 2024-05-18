// file.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { FileEntity } from './file.entity';
import { Response } from 'express';
import * as multer from 'multer';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB size limit
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: any,
  ): Promise<any> {
    if (!file) {
      throw new Error('File is missing');
    }
    console.log('uploading file in controller', file);
    console.log('file.originalname:', file.originalname);
    console.log('file.mimetype:', file.mimetype);
    console.log('file.size:', file.size);
    console.log('file.buffer:', file.buffer);
    console.log('metadata:', metadata);

    const uploadedFile: FileEntity = await this.fileService.uploadFile(
      file,
      metadata,
      false,
      file.buffer,
    ); // Assuming you want to use S3
    return { fileId: uploadedFile.id };
  }

  @Get(':fileId')
  async getFile(
    @Param('fileId') fileId: number,
    @Res() res: Response,
  ): Promise<void> {
    const fileBuffer = await this.fileService.getFile(fileId);

    // Get the file entity to obtain metadata such as mime type
    const fileEntity = await this.fileService.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!fileEntity) {
      throw new Error('File not found');
    }

    res.set({
      'Content-Type': fileEntity.fileType,
      'Content-Disposition': `attachment; filename="${fileEntity.fileName}"`,
    });

    res.send(fileBuffer);
  }

  @Put(':fileId')
  @UseInterceptors(FileInterceptor('file'))
  async putFile(
    @Param('fileId') fileId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: any,
  ): Promise<any> {
    console.log('Updating file with ID:', fileId);
    const updatedFile: FileEntity = await this.fileService.updateFile(
      fileId,
      file,
      metadata,
      false, // Assuming you want to use S3
    );
    return { fileId: updatedFile.id };
  }

  @Delete(':fileId')
  async deleteFile(@Param('fileId') fileId: number): Promise<void> {
    console.log('Deleting file with ID:', fileId);
    await this.fileService.deleteFile(fileId);
  }

  @Get()
  async getFiles(): Promise<FileEntity[]> {
    return await this.fileService.getFiles();
  }
}
