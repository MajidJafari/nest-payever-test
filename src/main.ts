import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomValidationPipe } from './interfaces/pipes/custom-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://payever.test',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api').useGlobalPipes(new CustomValidationPipe());
  await app.listen(3000);
}
bootstrap();
