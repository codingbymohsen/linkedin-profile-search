import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchModule } from './modules/search/search.module';

@Module({
	// Feature modules keep the application shell small and independently testable.
	imports: [ConfigModule.forRoot({ isGlobal: true }), SearchModule],
})
export class AppModule {}
