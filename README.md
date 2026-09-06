# LinkedIn Profile Search

Dockerized full-stack test project using Next.js/React, Nest.js, PostgreSQL and Elasticsearch. Elasticsearch uses the Elastic-maintained Docker Official Image from Docker Hub so Docker Hub registry mirrors can be used.

## Run

```bash
docker compose up --build
```

Open http://localhost:3002. API: http://localhost:3003. Elasticsearch: http://localhost:9200. PostgreSQL is exposed on localhost:5433 (container port 5432).

The backend imports the supplied CSV-like file on startup and indexes public profile fields in Elasticsearch. Search uses Elasticsearch multi-match with fuzzy matching; filters currently cover industry, company and location. Export applies the active query and filters and returns an Excel file. Sensitive contact and address fields are never returned by the public API.

Semantic search/vector retrieval is intentionally left as the next extension: the search service should gain an embedding provider and a `dense_vector` field, then combine BM25 and kNN results as hybrid search.
