import { Injectable } from '@nestjs/common';
import { Actor, Movie } from 'src/graph/graph.dto';
import { GraphService } from 'src/graph/graph.service';


@Injectable()
export class ExploreService {
  constructor(private readonly graphService: GraphService) {}

  async expandNode(nconst: string) {

    const result = await this.graphService.runCypher<{a1: Actor, a2: Actor, m: Movie }>(`
        MATCH (a1:Person {id: $id})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(a2:Person)
        WHERE a1.id <> a2.id
        RETURN DISTINCT a1, a2, m
        `,
      {
        id: nconst,
      },
      ["a1", "a2", "m"]
    );

    const root = result?.[0].a1

    // get unique actors
    const seen = new Set(root.id) 
    const newNodes: {id: string, label: string}[]= []
    for(const res of result){
      const actor = res.a2
      if(seen.has(actor.id)) continue
      newNodes.push({ id: actor.id, label: actor.name })
      seen.add(actor.id)
    }

    // hash edge names to get colour
    const stringToColour = (str: string) => {
      let hash = 0;
      str.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
      })
      let colour = '#'
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        colour += value.toString(16).padStart(2, '0')
      }
      return colour
    }

    // return nodes and edges
    return {
      rootNode: { id: root.id, label: root.name },
      newNodes,
      edges: result.map(r => ({ 
        id: `${r.a1.id}-${r.m.id}-${r.a2.id}`,
        color: stringToColour(r.m.id),
        from: r.a1.id, to: r.a2.id,
        label: r.m.title
      }))
    }
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
