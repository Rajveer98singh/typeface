import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import * as multer from 'multer';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Use Multer with in-memory storage
  app.use(multer({ storage: multer.memoryStorage() }).any());

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  await app.listen(3000);
}
bootstrap();
