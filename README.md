# Graph Visualizer

## Plan
1. Start with the IMDB dataset to model actor connections
2. Expand into other datasets (for example, sports teams), where data is available (potentially scrape?)

# Setup
1. add IMDB files to /data
2. start services with `docker compose up`
3. load DB with `npm run import`

# Data

## cleaning the data
```bash
awk -F'\t' 'NF == 6' data/name.basics.tsv > data/name.basics.cleaned.tsv
```

## manually create index?
- requires some data to be inserted first
- messy, AGE does not have index support
```sql
-- For Person nodes
CREATE INDEX person_properties_gin ON imdb_graph."Person" USING GIN (properties);

-- For Movie nodes
CREATE INDEX movie_properties_gin ON imdb_graph."Movie" USING GIN (properties);
```