// src/graph/graph.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ExploreService } from './explore.service';

@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  // to init, use id of starting node
  @Get('expand-node/:id')
  async expandNode(@Param('id') id: string) {
    return this.exploreService.expandNode(id);
  }

  // get starting nodes?
  @Get('search')
  async search(@Query('query') query: string) {
    return this.exploreService.searchNodes(query);
  }
}
