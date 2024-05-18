// file.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { FileEntity } from './file.entity';
import { FileService } from './file.service';
import { AwsS3Service } from './aws-s3.service';
import { MulterModule } from '@nestjs/platform-express/multer';
// import multer from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    MulterModule.register({
      dest: './uploads',
      //   storage: multer.memoryStorage(),
    }),
  ],
  controllers: [FileController],
  providers: [FileService, AwsS3Service],
})
export class FileModule {}
