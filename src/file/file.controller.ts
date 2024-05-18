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
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { FileEntity } from './file.entity';
import { Response } from 'express';
import * as multer from 'multer';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

@ApiTags('files')
@Controller('files')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiResponse({
    status: 201,
    description: 'The file has been successfully uploaded.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB size limit
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ValidationPipe()) metadata: any,
  ): Promise<any> {
    if (!file) {
      this.logger.error('File is missing');
      throw new HttpException('File is missing', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Uploading file: ${file.originalname}`);

    try {
      const uploadedFile: FileEntity = await this.fileService.uploadFile(
        file,
        metadata,
        false,
        file.buffer,
      );
      return { fileId: uploadedFile.id };
    } catch (error) {
      this.logger.error('Error uploading file', error.stack);
      throw new HttpException(
        'Error uploading file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get a file by ID' })
  @ApiResponse({
    status: 200,
    description: 'The file has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  async getFile(
    @Param('fileId') fileId: number,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const fileBuffer = await this.fileService.getFile(fileId);
      const fileEntity = await this.fileService.fileRepository.findOne({
        where: { id: fileId },
      });

      if (!fileEntity) {
        this.logger.error(`File with ID ${fileId} not found`);
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      res.set({
        'Content-Type': fileEntity.fileType,
        'Content-Disposition': `attachment; filename="${fileEntity.fileName}"`,
      });

      res.send(fileBuffer);
    } catch (error) {
      this.logger.error(`Error retrieving file with ID ${fileId}`, error.stack);
      throw new HttpException(
        'Error retrieving file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':fileId')
  @ApiOperation({ summary: 'Update a file' })
  @ApiResponse({
    status: 200,
    description: 'The file has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  @UseInterceptors(FileInterceptor('file'))
  async putFile(
    @Param('fileId') fileId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body(new ValidationPipe()) metadata: any,
  ): Promise<any> {
    if (!file) {
      this.logger.error('File is missing');
      throw new HttpException('File is missing', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Updating file with ID: ${fileId}`);

    try {
      const updatedFile: FileEntity = await this.fileService.updateFile(
        fileId,
        file,
        metadata,
        false,
      );
      return { fileId: updatedFile.id };
    } catch (error) {
      this.logger.error(`Error updating file with ID ${fileId}`, error.stack);
      throw new HttpException(
        'Error updating file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a file by ID' })
  @ApiResponse({
    status: 200,
    description: 'The file has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'File not found.' })
  async deleteFile(@Param('fileId') fileId: number): Promise<void> {
    this.logger.log(`Deleting file with ID: ${fileId}`);

    try {
      await this.fileService.deleteFile(fileId);
    } catch (error) {
      this.logger.error(`Error deleting file with ID ${fileId}`, error.stack);
      throw new HttpException(
        'Error deleting file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all files' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully.' })
  async getFiles(): Promise<FileEntity[]> {
    try {
      return await this.fileService.getFiles();
    } catch (error) {
      this.logger.error('Error retrieving files', error.stack);
      throw new HttpException(
        'Error retrieving files',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
