import { Injectable } from '@nestjs/common';
import { Actor, Movie } from 'src/graph/graph.dto';
import { GraphService } from 'src/graph/graph.service';

@Injectable()
export class ExploreService {
  constructor(private readonly graphService: GraphService) {}

  async nodeConnections(nconst: string) {
    const result = await this.graphService.runCypher<{ result: number }>(
      `
        MATCH (a1:Person {id: $id})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(a2:Person)
        WHERE a1.id <> a2.id
        RETURN COUNT(DISTINCT a2)
        `,
      {
        id: nconst,
      },
    );
    return result[0];
  }

  async expandNode(nconst: string) {
    const result = await this.graphService.runCypher<{
      a1: Actor;
      a2: Actor;
      m: Movie;
    }>(
      `
        MATCH (a1:Person {id: $id})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(a2:Person)
        WHERE a1.id <> a2.id
        RETURN DISTINCT a1, a2, m
        `,
      {
        id: nconst,
      },
      ['a1', 'a2', 'm'],
    );

    const root = result?.[0].a1;

    // get unique actors
    const seen = new Set(root.id);
    const newNodes = result.reduce(
      (acc, cur) => {
        const actor = cur.a2;
        if (seen.has(actor.id)) return acc;
        acc?.push({
          id: actor.id,
          label: actor.name,
          birthYear: actor.birthYear,
        });
        seen.add(actor.id);
        return acc;
      },
      [] as { id: string; label: string; birthYear: string }[],
    );

    // hash edge names to get colour
    const stringToColour = (str: string) => {
      let hash = 0;
      str.split('').forEach((char) => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash);
      });
      let colour = '#';
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        colour += value.toString(16).padStart(2, '0');
      }
      return colour;
    };

    // include the movies for a node
    const nodeToMovies = result.reduce(
      (acc, edge) => {
        if (!acc[edge.a1.id]) acc[edge.a1.id] = new Set();
        if (!acc[edge.a2.id]) acc[edge.a2.id] = new Set();

        if (edge.m.id) {
          acc[edge.a1.id].add(edge.m.id);
          acc[edge.a2.id].add(edge.m.id);
        }
        return acc;
      },
      {} as Record<string, Set<string>>,
    );

    // return nodes and edges
    return {
      rootNode: {
        id: root.id,
        label: root.name,
        birthYear: root.birthYear,
        movies: Array.from(nodeToMovies[root.id] ?? []),
      },
      newNodes: newNodes.map((n) => ({
        ...n,
        movies: Array.from(nodeToMovies[n.id] ?? []),
      })),
      edges: result.map((r) => ({
        id: `${r.a1.id}-${r.m.id}-${r.a2.id}`,
        color: stringToColour(r.m.id),
        from: r.a1.id,
        to: r.a2.id,
        label: `${r.m.title} - ${r.m.year}`,
        title: r.m.title,
        movieId: r.m.id,
        year: r.m.year,
        // maybe we don't return this and let the FE handle it?
        inCommon: [{
          movieId: r.m.id,
          title: r.m.title,
          year: r.m.year
        }]
      })),
    };
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
