import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Global API prefix — frontend calls /api/auth/login etc.
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable custom exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger configuration for API documentation
  const config = new DocumentBuilder()
    .setTitle('Apply-as-a-Service V1 API')
    .setDescription('API documentation for Apply-as-a-Service V1')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('profile')
    .addTag('jobs')
    .addTag('applications')
    .addTag('automation')
    .addTag('notifications')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap();
