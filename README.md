# Graph Visualizer

## about
ingest graph data into Postgres with the Apache AGE graph db extension

visualize and explore with vis.js

## roadmap 
1. Start with the IMDB dataset to model actor connections
2. Expand into other datasets (for example, sports teams), where data is available (potentially scrape?)

## setup
1. add IMDB files to /data
2. start services with `docker compose --env-file .dev.env up -d`
3. load DB with `npm run import`
