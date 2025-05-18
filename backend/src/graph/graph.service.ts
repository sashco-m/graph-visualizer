import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'pg';

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
    await this.client.query(`CREATE EXTENSION IF NOT EXISTS age;`);
    await this.client.query(`LOAD 'age';`);
    await this.client.query(`SET search_path = ag_catalog, "$user", public;`);
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

  async runCypher(
    query: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    const text = `SELECT * FROM cypher('${this.graphName}', $$ ${query} $$, $1) AS (result agtype)`;
    // console.log(text)
    const values = [params ? JSON.stringify(params) : 'NULL'];
    return this.client.query(text, values);
  }

  async close() {
    await this.client.end();
  }
}
