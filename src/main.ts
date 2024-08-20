import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomValidationPipe } from './interfaces/pipes/custom-validation.pipe';
import { WrapResponseInterceptor } from './interfaces/interceptors/wrap-response.interceptor';
import { CustomExceptionFilter } from './interfaces/filters/custom-exception.filter';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://payever.test',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(helmet());

  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

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
