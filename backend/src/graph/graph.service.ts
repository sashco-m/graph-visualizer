import { Injectable, OnModuleInit } from '@nestjs/common';
import { types, Client } from 'pg';
import { setAGETypes } from 'src/lib/parser';
import { AgNode } from './graph.dto';

@Injectable()
export class GraphService implements OnModuleInit {
  private client: Client;
  private readonly graphName = 'imdb_graph';

  async onModuleInit() {
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'imdb',
    });

    await this.client.connect();
    await this.setupGraph(); // create the graph if not exists
  }

  private async setupGraph() {
    console.log('DB setup...');
    await setAGETypes(this.client, types);
    await this.client.query(
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM ag_catalog.ag_graph WHERE name = '${this.graphName}') THEN
          PERFORM create_graph('${this.graphName}');
        END IF;
      END $$;`,
    );
    // delete existing nodes
    //await this.client.query(`
    //  SELECT * FROM cypher('${this.graphName}', $$
    //  MATCH (n) DETACH DELETE n
    //  $$) AS (ignored agtype);
    //`)
    // speed up inserts
    await this.client.query('SET synchronous_commit = OFF;');
    console.log('DB setup complete.');
  }

  async runCypher<T>(
    query: string,
    params: Record<string, any> = {},
  ): Promise<AgNode<T>[]> {
    const text = `SELECT * FROM cypher('${this.graphName}', $$ ${query} $$, $1) AS (result agtype)`;
    // console.log(text)
    const values = [params ? JSON.stringify(params) : 'NULL'];
    const res = await this.client.query(text, values);
    // todo improve typing
    return res.rows.map((row) => {
      const node = row.result;
      const properties = node?.get('properties');
      return properties instanceof Map
        ? this.mapToObject(properties)
        : (properties ?? node);
    });
  }

  private mapToObject(map: Map<any, any>): any {
    const obj: any = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value instanceof Map ? this.mapToObject(value) : value;
    }
    return obj;
  }

  async close() {
    await this.client.end();
  }
}
