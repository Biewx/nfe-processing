import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NfeModule } from './v1/nfe/nfe.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port:5432,
      username: 'postgres',
      password: '12345678',
      database: 'postgres',

      autoLoadEntities: true,
    }),
    
    NfeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
