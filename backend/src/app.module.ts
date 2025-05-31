import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphModule } from './graph/graph.module';
import { ExploreModule } from './explore/explore.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '../.env.prod' : '../.env.dev'
    }),
    GraphModule,
    ExploreModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
