import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';

/**
 * Given a URL (e.g. "https://datasets.imdbws.com/title.basics.tsv.gz"),
 * fetches it, pipes through gunzip, and writes the decompressed `.tsv` into ./data/.
 * Returns the absolute path to the downloaded .tsv file.
 */
export async function downloadAndDecompressTsv(url: string): Promise<string> {
  // Ensure ./data directory exists
  const dataDir = path.resolve('./data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Derive a local filename from the URL: e.g. "title.basics.tsv"
  const gzName = url.split('/').pop();              // e.g. "title.basics.tsv.gz"
  if (!gzName) throw new Error(`Invalid URL: ${url}`);
  const baseName = gzName.replace(/\.gz$/, '');      // e.g. "title.basics.tsv"
  const outPath = path.join(dataDir, baseName);

  // If file already exists, skip downloading again
  if (fs.existsSync(outPath)) {
    console.log(`⏭️  Skipping download (already exists): ${baseName}`);
    return outPath;
  }

  console.log(`⬇️  Downloading ${url} ...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }

  // Stream the response body → gunzip → write to outPath
  const gunzip = createGunzip();
  const destStream = fs.createWriteStream(outPath);

  await pipeline(response.body!, gunzip, destStream);
  console.log(`✅  Downloaded & decompressed to ${outPath}`);
  return outPath;
}

/**
 * Deletes the given file path if it exists. 
 * Call this after you’re completely done with the data.
 */
export async function removeFileIfExists(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`🗑️  Deleted ${filePath}`);
    }
  } catch (err) {
    console.warn(`Failed to delete ${filePath}:`, err);
  }
}
