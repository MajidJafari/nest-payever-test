import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomValidationPipe } from './interfaces/pipes/custom-validation.pipe';
import { WrapResponseInterceptor } from './interfaces/interceptors/wrap-response.interceptor';
import { CustomExceptionFilter } from './interfaces/filters/custom-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://payever.test',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app
    .setGlobalPrefix('api')
    .useGlobalPipes(
      new CustomValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    .useGlobalInterceptors(new WrapResponseInterceptor())
    .useGlobalFilters(new CustomExceptionFilter());
  await app.listen(3000);
}
bootstrap();
