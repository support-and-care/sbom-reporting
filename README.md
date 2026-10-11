# sbom-reporting

Reporting frontend for SBOM data managed in [Dependency-Track](https://dependencytrack.org/).

Built with [Next.js](https://nextjs.org/) (App Router, TypeScript, Tailwind CSS) and shipped as a container image.

## Prerequisites

- Node.js — version pinned in [`.nvmrc`](.nvmrc) (`nvm use`)
- pnpm — version pinned via `packageManager` in [`package.json`](package.json) (`corepack enable`)
- Docker (optional, for building the container image)

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start the development server         |
| `pnpm build`     | Create a production build            |
| `pnpm start`     | Start the production server          |
| `pnpm lint`      | Run ESLint                           |
| `pnpm typecheck` | Generate route types and run `tsc`   |

## Container

The app uses Next.js [standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) and is packaged by the multi-stage [`Dockerfile`](Dockerfile).

```bash
docker build -t sbom-reporting .
docker run --rm -p 3000:3000 sbom-reporting
```

The container listens on port `3000` and exposes a health endpoint at `/api/health`.

## License

[Apache License 2.0](LICENSE)
