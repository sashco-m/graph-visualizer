# Graph Visualizer

## about
ingest graph data into Postgres with the Apache AGE graph db extension

visualize and explore with vis.js

## roadmap 
1. Start with the IMDB dataset to model actor connections
2. Expand into other datasets (for example, sports teams), where data is available (potentially scrape?)

## setup
1. add IMDB files to /data
2. start services (see below)
3. load DB with `npm run import`

### dev
start services with `
```bash
docker compose -f docker-compose.yaml  --env-file .dev.env up
```

### prod

### first time (cert setup)


### every time
start services with
```bash
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml --env-file .prod.env up -d
```