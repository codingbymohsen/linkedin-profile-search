import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);
	app.enableCors();
	app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

	// Generate the OpenAPI document once at startup and expose the interactive API explorer.
	const swaggerConfig = new DocumentBuilder()
		.setTitle('LinkedIn Profile Search API')
		.setDescription('Search, filter, and export public candidate profile data.')
		.setVersion('1.0')
		.build();
	SwaggerModule.setup(
		'api/docs',
		app,
		SwaggerModule.createDocument(app, swaggerConfig),
	);
	await app.listen(configService.get<number>('PORT', 3001));
}
bootstrap();
