import { Module } from '@nestjs/common';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { GraphService } from 'src/graph/graph.service';

@Module({
  controllers: [ExploreController],
  providers: [ExploreService, GraphService],
  exports: [ExploreService],
})
export class ExploreModule {}
