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
    // await this.setupGraph(); // create the graph if not exists
  }

  private async setupGraph() {
    // Create the AGE graph if it doesn't already exist
    await this.client.query(`CREATE EXTENSION IF NOT EXISTS age;`);
    await this.client.query(`LOAD 'age';`);
    await this.client.query(
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM ag_catalog.ag_graph WHERE name = '${this.graphName}') THEN
          PERFORM create_graph('${this.graphName}');
        END IF;
      END $$;`,
    );
  }

  async runCypher(query: string, params: Record<string, any> = {}): Promise<any> {
    const text = `SELECT * FROM cypher($1, $2, $3) AS (result agtype)`;
    const values = [this.graphName, JSON.stringify(params), query];
    return this.client.query(text, values);
  }
  

  async close() {
    await this.client.end();
  }
}
