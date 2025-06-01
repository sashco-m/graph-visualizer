import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { GraphService } from 'src/graph/graph.service';
import { PersonRow, PrincipalRow, RatingRow, TitleRow } from './types';
import { downloadAndDecompressTsv, removeFileIfExists } from './download';

/*
  Last main TODO
  - use a csv library that allows skipping malformed rows
  - have the import work with a single command - auto-download and delete datasets
*/

// tsv helper
async function streamTsv<T>(
  filePath: string,
  onBatch: (batch: T[]) => Promise<void>,
  batchSize: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const batch: T[] = [];
    let count = 0;
    console.log(`Loading ${filePath}...`);

    const parser = fs
      .createReadStream(path.resolve(filePath))
      .pipe(csv.parse({ headers: true, delimiter: '\t', quote: '\0' }));

    parser
      .on('data', async (row) => {
        parser.pause();

        batch.push(row as T);
        count++;

        if (batch.length >= batchSize) {
          try {
            console.log('Inserting batch...');
            await onBatch([...batch]);
            console.log(`Batch complete. Total: ${count} rows`);
            // clears array
            batch.length = 0;
          } catch (err) {
            reject(err);
          }
        }

        parser.resume();
      })
      .on('end', async () => {
        if (batch.length > 0) await onBatch(batch);
        console.log(`${filePath} load complete.`);
        resolve();
      })
      .on('error', reject);
  });
}

// https://docs.nestjs.com/standalone-applications
// main import function
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // 1) Prepare a list of each dataset URL
  const imdbUrls = {
    ratings:   'https://datasets.imdbws.com/title.ratings.tsv.gz',
    basics:    'https://datasets.imdbws.com/title.basics.tsv.gz',
    principals:'https://datasets.imdbws.com/title.principals.tsv.gz',
    names:     'https://datasets.imdbws.com/name.basics.tsv.gz',
  };

  // 2) Download & decompress each one, getting back local .tsv paths
  const localRatingsPath   = await downloadAndDecompressTsv(imdbUrls.ratings);
  const localBasicsPath    = await downloadAndDecompressTsv(imdbUrls.basics);
  const localPrincipalsPath= await downloadAndDecompressTsv(imdbUrls.principals);
  const localNamesPath     = await downloadAndDecompressTsv(imdbUrls.names);

  // make a cli arg
  const BATCH_SIZE = 50_000;

  const graph = app.get(GraphService);

  await graph.runQuery(
    `DROP INDEX IF EXISTS person_properties_gin`,
  );
  await graph.runQuery(
    `DROP INDEX IF EXISTS movie_properties_gin`,
  );

  // optimization: only insert popular movies
  const MOVIE_LIMIT = 10_000;

  let topMovies: { id: string; votes: number }[] = [];

  // store the people and movies ingested to cut down on
  // edge inserts
  const existingPersonIds = new Set<string>();
  const existingMovieIds = new Set<string>();

  await streamTsv<RatingRow>(
    localRatingsPath,
    async (batch) => {
      const votes = batch
        .filter((r) => !isNaN(parseInt(r.numVotes)))
        .map((r) => ({
          id: r.tconst,
          votes: parseInt(r.numVotes),
        }));

      topMovies.push(...votes);

      topMovies.sort((a, b) => b.votes - a.votes);

      topMovies = topMovies.slice(0, MOVIE_LIMIT);
    },
    100_000,
  );

  const topMovieIds = new Set(topMovies.map((m) => m.id));

  console.log('🔹 Importing movies...');
  await streamTsv<TitleRow>(
    localBasicsPath,
    async (batch) => {
      const movies = batch
        .filter((r) => topMovieIds.has(r.tconst))
        // .filter((row) => row.titleType === 'movie')
        .filter((r) => r.startYear !== '\\N')
        // .filter((r) => parseInt(r.startYear) >= 1995)
        .filter((r) => r.isAdult === '0')
        .map((m) => ({
          id: m.tconst,
          title: m.primaryTitle,
          year: parseInt(m.startYear),
        }));

      if (!movies.length) return;

      await graph.runCypher(
        `
        UNWIND $movies AS movie
        CREATE (m:Movie {id: movie.id})
        SET m.title = movie.title, m.year = movie.year
      `,
        { movies },
      );

      for (const movie of movies) {
        existingMovieIds.add(movie.id);
      }
    },
    BATCH_SIZE,
  );

  const topActorIds = new Set<string>();

  console.log('🔹 Finding valid actors...');
  await streamTsv<PrincipalRow>(
    localPrincipalsPath,
    async (batch) => {
      const relationships = batch
        .filter((row) => row.category === 'actor' || row.category === 'actress')
        .filter((r) => topMovieIds.has(r.tconst));

      if (!relationships.length) return;

      for (const rel of relationships) {
        topActorIds.add(rel.nconst);
      }
    },
    BATCH_SIZE,
  );

  console.log('🔹 Importing people...');
  await streamTsv<PersonRow>(
    localNamesPath,
    async (batch) => {
      const people = batch
        .filter((p) => p.birthYear !== '\\N')
        // .filter((p) => parseInt(p.birthYear) >= 1960)
        .filter((p) => topActorIds.has(p.nconst))
        .map((row) => ({
          id: row.nconst,
          name: row.primaryName,
          birthYear: parseInt(row.birthYear),
        }));

      if (!people.length) return;

      await graph.runCypher(
        `
        UNWIND $people AS person
        CREATE (p:Person {id: person.id})
        SET p.name = person.name, p.birthYear = person.birthYear
      `,
        { people },
      );

      for (const person of people) {
        existingPersonIds.add(person.id);
      }
    },
    BATCH_SIZE,
  );

  // index creation (speeds up following matches a lot)
  // https://github.com/apache/age/discussions/130
  // https://github.com/apache/age/discussions/45
  await graph.runQuery(
    `CREATE INDEX IF NOT EXISTS person_properties_gin ON imdb_graph."Person" USING GIN (properties);`,
  );
  await graph.runQuery(
    `CREATE INDEX IF NOT EXISTS movie_properties_gin ON imdb_graph."Movie" USING GIN (properties);`,
  );

  console.log('🔹 Linking actors to movies...');
  await streamTsv<PrincipalRow>(
    localPrincipalsPath,
    async (batch) => {
      const relationships = batch
        .filter((row) => row.category === 'actor' || row.category === 'actress')
        .filter(
          (r) =>
            existingMovieIds.has(r.tconst) && existingPersonIds.has(r.nconst),
        )
        .map((row) => ({
          personId: row.nconst,
          movieId: row.tconst,
        }));

      console.log(`Inserting ${relationships.length} edges...`);

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

  // 4) Once everything’s done, delete the downloaded .tsv files:
  await removeFileIfExists(localRatingsPath);
  await removeFileIfExists(localBasicsPath);
  await removeFileIfExists(localPrincipalsPath);
  await removeFileIfExists(localNamesPath);

  console.log('✅ Done');

  await app.close();
}

bootstrap();
