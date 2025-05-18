import { Injectable } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';

@Injectable()
export class ExploreService {
  constructor(private readonly graphService: GraphService) {}

  async expandNode(nconst: string) {
    const result = await this.graphService.runCypher(`
        MATCH (a1:Person {id: $id})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(a2:Person)
        RETURN DISTINCT a1, a2, m
        LIMIT 100
        `,
      {
        id: nconst,
      },
    );

    return result;
  }

  async searchNodes(query: string) {
    const rows = await this.graphService.runCypher<{
      id: string;
      name: string;
      birthYear: number;
    }>(
      `
            MATCH (p:Person)
            WHERE toLower(p.name) CONTAINS toLower($query)
            RETURN p
            LIMIT 10
        `,
      {
        query,
      },
    );

    return rows;
  }
}
