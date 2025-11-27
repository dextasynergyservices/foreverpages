Minimal Docker image for template worker

Build:

```bash
docker build -t foreverpages/template-worker:latest .
```

Usage (server):

Set `TEMPLATE_WORKER_DOCKER_IMAGE=foreverpages/template-worker:latest` in the environment. The queue will run:

```bash
docker run --rm -v "<extractionDir>:/work" -w /work foreverpages/template-worker:latest /bin/sh -c "npx tsc --noEmit || true; npx eslint . || true"
```

Notes:

- The image installs `typescript` and `eslint` globally for convenience. For strict reproducibility, pin versions and include your project's node_modules instead.
- If you use project-local `node_modules`, mount the project root instead of only the extraction directory.

## CI / Build & Push

You can build and push the worker image from CI. Example GitHub Actions workflow is provided in `.github/workflows/ci-worker.yml` and will build the image on changes to `docker/worker`.

To build locally and push to a registry:

```bash
# Build (override with WORKER_IMAGE environment variable if desired)
WORKER_IMAGE=ghcr.io/<org>/template-worker:1.0.0 pnpm run docker:build-worker

# Push
WORKER_IMAGE=ghcr.io/<org>/template-worker:1.0.0 pnpm run docker:push-worker
```

If you use GitHub Packages or another registry, set `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, and `WORKER_IMAGE` as repository secrets for the workflow to push automatically.
