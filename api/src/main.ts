import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig } from '@common/constants/app-config.constant';
import cookieParser from 'cookie-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use the Socket.IO adapter so @WebSocketGateway (namespace `chat`, engine
  // path `/socket.io/`) is served by the same HTTP server. Without this Nest
  // falls back to the `ws`-based WsAdapter, the `/socket.io` engine endpoint
  // does not exist, and the socket.io-client can never connect.
  app.useWebSocketAdapter(new IoAdapter(app));

  // Set global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Use cookie parser middleware
  app.use(cookieParser());

  // Set Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? AppConfig.APP_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  /*
    Setup Swagger docs 
  */
  const config = new DocumentBuilder()
    .setTitle('API Educlass Documentation')
    .setDescription('API documentation for the Education class application')
    .setVersion('1.0')
    // .addTag('auth', 'Authentication related endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Refresh-JWT',
        description: 'Enter refresh JWT token',
        in: 'header',
      },
      'JWT-refresh',
    )
    .addServer('http://localhost:5000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar {display: none;}
      .swagger-ui .info {margin: 50px 0;}
      .swagger-ui .info .title {color: #4A90E2}
      `,
  });

  // Node closes keep-alive sockets after only 5 seconds by default, while the
  // Next.js dev proxy holds upstream sockets in its pool much longer. When the
  // proxy reuses a socket the backend already closed, the request dies with
  // ECONNRESET ("socket hang up"). Raise the server timeouts so idle sockets
  // survive between user actions. (headersTimeout must stay > keepAliveTimeout.)
  const server = app.getHttpServer();
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 70_000;

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap().catch((err) => {
  Logger.error('Error starting server', err);
  process.exit(1);
});
