import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphModule } from './graph/graph.module';
import { ExploreModule } from './explore/explore.module';

@Module({
  imports: [GraphModule, ExploreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
