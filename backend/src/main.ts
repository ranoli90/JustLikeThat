import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
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
    .addTag('preferences')
    .addTag('notifications')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
