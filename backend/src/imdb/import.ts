import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import fs from 'fs';
import path from 'path';
import csv from 'fast-csv';
import { GraphService } from 'src/graph/graph.service';
import { PersonRow, PrincipalRow, TitleRow } from './types';

// tsv helper
async function streamTsv<T>(
  filePath: string,
  onBatch: (batch: T[]) => Promise<void>,
  batchSize: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const batch: T[] = [];
    let count = 0;

    fs.createReadStream(path.resolve(filePath))
      .pipe(csv.parse({ headers: true, delimiter: '\t' }))
      .on('data', async (row) => {
        batch.push(row as T);
        count++;

        if (batch.length >= batchSize) {
          await onBatch([...batch]);
          // clears array
          batch.length = 0;
        }
      })
      .on('end', async () => {
        if (batch.length > 0) await onBatch(batch);
        resolve();
      })
      .on('error', reject);
  });
}

// https://docs.nestjs.com/standalone-applications
// main import function
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // make a cli arg
  const BATCH_SIZE = 50_000;

  const graph = app.get(GraphService);

  console.log('🔹 Importing people...');
  await streamTsv<PersonRow>(
    'data/name.basics.tsv',
    async (batch) => {
      const queries = batch.map((row) => {
        const name = row.primaryName.replace(/'/g, "\\'");
        return `(:Person {id: '${row.nconst}', name: '${name}'})`;
      });
      if (queries.length) {
        await graph.runCypher(`CREATE ${queries.join(', ')}`);
      }
    },
    BATCH_SIZE,
  );

  console.log('🔹 Importing movies...');
  await streamTsv<TitleRow>(
    'data/title.basics.tsv',
    async (batch) => {
      const queries = batch
        .filter((row) => row.titleType === 'movie')
        .map((row) => {
          const title = row.primaryTitle.replace(/'/g, "\\'");
          return `(:Movie {id: '${row.tconst}', title: '${title}'})`;
        });
      if (queries.length) {
        await graph.runCypher(`CREATE ${queries.join(', ')}`);
      }
    },
    BATCH_SIZE,
  );

  console.log('🔹 Linking actors to movies...');
  await streamTsv<PrincipalRow>(
    'data/title.principals.tsv',
    async (batch) => {
      const relationships = batch
        .filter((row) => row.category === 'actor' || row.category === 'actress')
        .map((row) => ({
          personId: row.nconst,
          movieId: row.tconst,
        }));

      if (!relationships.length) return;

      await graph.runCypher(
        `
        UNWIND $rels AS rel
        MATCH (p:Person {id: rel.personId}), (m:Movie {id: rel.movieId})
        CREATE (p)-[:ACTED_IN]->(m)
        `,
        { rels: relationships },
      );
    },
    BATCH_SIZE,
  );

  console.log('✅ Done');

  await app.close();
}

bootstrap();
